// app/api/user/verification-status/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getVerificationStatus } from '@/lib/kyc-service';
import { 
  handleApiError, 
  AuthenticationError,
  ValidationError,
  validateRequired,
  databaseCircuitBreaker
} from '@/lib/error-handler';
import { checkDatabaseConnection, withRetry } from '@/lib/prisma';

// Mark this route as dynamic to handle cookies and request.url usage
export const dynamic = 'force-dynamic';

// Helper to get the current user ID from cookies with enhanced validation
const getCurrentUserId = (): string | null => {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;
    
    const session = JSON.parse(sessionCookie);
    const userId = session.userId;
    
    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return null;
    }
    
    return userId;
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
};

export async function GET(request: Request) {
  try {
    // Get userId from query param or from session
    const url = new URL(request.url);
    let userId = url.searchParams.get('userId');
    
    // If no userId in query, fall back to session
    if (!userId) {
      userId = getCurrentUserId();
    }
    
    if (!userId) {
      throw new AuthenticationError('Valid session or user ID required to view verification status');
    }
    
    // Validate userId format
    validateRequired(userId, 'userId');
    
    // Check database health before proceeding
    if (!(await checkDatabaseConnection())) {
      throw new Error('Database is currently unavailable');
    }
    
    // Use circuit breaker and retry logic for database operations
    const status = await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        return await getVerificationStatus(userId!);
      });
    });
    
    // Log successful verification status access
    console.log('VERIFICATION_STATUS_ACCESS_SUCCESS', {
      userId,
      overallStatus: status.overallStatus,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    // Enhanced error logging
    console.error('VERIFICATION_STATUS_ERROR', {
      userId: getCurrentUserId(),
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return handleApiError(error);
  }
}
