// app/api/admin/submissions/rejected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { VerificationStatusEnum } from '@/app/generated/prisma';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

const getCurrentUserId = (): string | null => {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const session = JSON.parse(sessionCookie);
    return session.userId || null;
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401 }
      );
    }    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('documentType');
    const searchQuery = searchParams.get('search');
    const dateFilter = searchParams.get('dateFilter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause specifically for rejected documents
    const where: any = {
      status: VerificationStatusEnum.REJECTED,
    };

    if (documentType && documentType !== 'all') {
      where.type = documentType;
    }

    if (searchQuery) {
      where.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: searchQuery, mode: 'insensitive' } },
              { lastName: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        },
        { fileName: { contains: searchQuery, mode: 'insensitive' } },
        { notes: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Date filtering
    if (dateFilter) {
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          where.verifiedAt = {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          };
          break;
        case 'week':
          where.verifiedAt = {
            gte: new Date(now.setDate(now.getDate() - 7)),
          };
          break;
        case 'month':
          where.verifiedAt = {
            gte: new Date(now.setMonth(now.getMonth() - 1)),
          };
          break;
      }
    }    // Get the total count of documents matching the criteria
    const totalCount = await prisma.kYCDocument.count({ where });

    // Get rejected documents
    const rejectedDocuments = await prisma.kYCDocument.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        verifiedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Find the audit logs for these documents to get rejection information
    const documentIds = rejectedDocuments.map(doc => doc.id);
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetId: { in: documentIds },
        action: { contains: 'REJECT', mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response for the UI
    const formattedRejectedSubmissions = rejectedDocuments.map(doc => {
      // Find the most recent audit log entry for this document's rejection
      const rejectionLog = auditLogs.find(log => log.targetId === doc.id);
      
      return {
        id: doc.id,
        userId: doc.userId,
        userName: `${doc.user.firstName} ${doc.user.lastName}`,
        userEmail: doc.user.email,
        documentType: doc.type,
        dateSubmitted: doc.uploadedAt.toISOString(),
        dateRejected: doc.verifiedAt?.toISOString() || null,
        status: doc.status,
        fileName: doc.fileName,
        rejectedBy: doc.verifiedBy || rejectionLog?.userId || 'Admin User',
        rejectionReason: doc.notes || 'Document rejected',
        allowReupload: true, // This would typically come from a field in your database
      };
    });

    return NextResponse.json({
      data: formattedRejectedSubmissions,
      pagination: {
        total: totalCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });
  } catch (error: any) {
    console.error('FETCH_REJECTED_SUBMISSIONS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching rejected submissions',
      }),
      { status: 500 }
    );
  }
}
