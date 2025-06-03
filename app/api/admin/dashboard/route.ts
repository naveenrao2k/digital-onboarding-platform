import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Total users count
    const totalUsers = await prisma.user.count();

    // Pending verifications count (users with any KYC document or selfie verification in PENDING or IN_PROGRESS)
    const pendingVerifications = await prisma.kYCDocument.count({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    // Completed verifications count (documents approved)
    const completedVerifications = await prisma.kYCDocument.count({
      where: {
        status: 'APPROVED',
      },
    });

    // Rejected verifications count (documents rejected)
    const rejectedVerifications = await prisma.kYCDocument.count({
      where: {
        status: 'REJECTED',
      },
    });

    // Pending reviews: fetch recent pending or in-progress documents with user info
    const pendingReviewsRaw = await prisma.kYCDocument.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: 10,
    });

    // Format pending reviews
    const pendingReviews = pendingReviewsRaw.map((doc: any) => ({
      id: doc.id,
      userId: doc.userId,
      userName: `${doc.user.firstName} ${doc.user.lastName}`,
      documentType: doc.type,
      dateSubmitted: doc.uploadedAt.toISOString().split('T')[0],
      status: doc.status,
    }));

    // Return the dashboard data
    return NextResponse.json({
      totalUsers,
      pendingVerifications,
      completedVerifications,
      rejectedVerifications,
      pendingReviews,
    });
  } catch (error: any) {
    console.error('DASHBOARD_DATA_ERROR', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
