import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VerificationStatusEnum } from '@/app/generated/prisma';

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
    
    // Get weekly submissions data (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6); // 7 days including today
    
    // Get all submissions for the last 7 days
    const weeklySubmissionsRaw = await prisma.kYCDocument.findMany({
      where: {
        uploadedAt: {
          gte: weekAgo,
        },
      },
      select: {
        uploadedAt: true,
      },
    });
    
    // Group submissions by day
    const weeklySubmissions = Array(7).fill(0).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayCount = weeklySubmissionsRaw.filter(
        submission => {
          const submissionDate = new Date(submission.uploadedAt);
          return submissionDate >= date && submissionDate < nextDate;
        }
      ).length;
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: dayNames[date.getDay()],
        count: dayCount,
        date: date.toISOString().split('T')[0],
      };
    });
    
    // Get status distribution data
    const statusCounts = await prisma.kYCDocument.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });
    
    // Calculate total documents for percentage calculation
    const totalDocuments = statusCounts.reduce(
      (acc, curr) => acc + curr._count.status, 
      0
    );
    
    // Format status distribution data
    const statusColors = {
      PENDING: '#f59e0b', // Amber
      IN_PROGRESS: '#3b82f6', // Blue
      APPROVED: '#10b981', // Green
      REJECTED: '#ef4444', // Red
      FLAGGED: '#fb923c', // Orange
    };
    
    const statusLabels = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      FLAGGED: 'Flagged',
    };
    
    const statusDistribution = statusCounts.map(item => {
      const status = item.status as keyof typeof statusColors;
      return {
        status: statusLabels[status],
        count: item._count.status,
        color: statusColors[status] || '#6b7280', // Default gray
        percentage: Math.round((item._count.status / totalDocuments) * 100),
      };
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
    }));    // Return the dashboard data
    return NextResponse.json({
      totalUsers,
      pendingVerifications,
      completedVerifications,
      rejectedVerifications,
      pendingReviews,
      weeklySubmissions,
      statusDistribution,
    });
  } catch (error: any) {
    console.error('DASHBOARD_DATA_ERROR', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
