// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile } from '@/lib/auth-service';
import { 
  handleApiError, 
  AuthenticationError,
  validateRequired,
  databaseCircuitBreaker
} from '@/lib/error-handler';
import { checkDatabaseConnection, withRetry } from '@/lib/prisma';

// Mark this route as dynamic to handle cookies usage
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

export async function GET() {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      throw new AuthenticationError('Valid session required to access profile');
    }
    
    // Check database health before proceeding
    if (!(await checkDatabaseConnection())) {
      throw new Error('Database is currently unavailable');
    }
    
    // Use circuit breaker and retry logic for database operations
    const profile = await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        return await getUserProfile(userId);
      });
    });
    
    // Log successful profile access
    console.log('USER_PROFILE_ACCESS_SUCCESS', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(profile);
    
  } catch (error: any) {
    // Enhanced error logging
    console.error('USER_PROFILE_ERROR', {
      userId: getCurrentUserId(),
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return handleApiError(error);
  }
}
