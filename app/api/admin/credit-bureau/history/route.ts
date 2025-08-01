import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

// Define a type for the included user data
type FraudDetectionWithUser = {
  id: string;
  bvn: string | null;
  userId: string;
  riskScore: number | null;
  isFraudSuspected: boolean;
  createdAt: Date;
  detectionDetails: any;
  responseData: any;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

export async function GET(req: NextRequest) {
  try {
    // Verify admin permissions
    const adminSession = await getAdminSession();
    const adminUser = adminSession?.user;

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }    // Get query parameters for BVN if provided
    const url = new URL(req.url);
    const bvn = url.searchParams.get('bvn');

    // Build the query
    const query: any = {
      where: {
        verificationType: 'CREDIT_CHECK',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent checks
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    };

    // If BVN is provided, filter by it
    if (bvn) {
      query.where.bvn = bvn;
    }    // Get credit check history
    const fraudChecks = await prisma.fraudDetection.findMany(query) as unknown as FraudDetectionWithUser[];

    // Format the response
    const history = fraudChecks.map(check => {
      // Parse the JSON details if needed
      const details = typeof check.detectionDetails === 'object' ? check.detectionDetails : {};

      // Get user name from included user data or from details
      let userName = 'Unknown';
      if (check.user) {
        userName = `${check.user.firstName || ''} ${check.user.lastName || ''}`.trim() || 'Unknown';
      } else if ((details as any)?.name) {
        userName = (details as any).name;
      }

      return {
        id: check.id,
        bvn: check.bvn || '',
        userName: userName,
        riskScore: check.riskScore || 0,
        createdAt: check.createdAt.toISOString(),
        isFraudSuspected: check.isFraudSuspected,
        responseData: check.responseData, // Include the full response data for reuse
        fraudReasons: (details as any)?.fraudReasons || []
      };
    });

    return new NextResponse(JSON.stringify({ history }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Credit history fetch error:', error);

    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
