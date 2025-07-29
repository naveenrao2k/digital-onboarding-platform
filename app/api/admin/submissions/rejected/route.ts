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
    const skip = (page - 1) * limit;    // For debugging - log the enum values used in comparison
    console.log('Looking for documents with status:', {
      REJECTED: VerificationStatusEnum.REJECTED,
      REQUIRES_REUPLOAD: VerificationStatusEnum.REQUIRES_REUPLOAD
    });

    // Build where clause specifically for rejected documents
    const where: any = {
      status: {
        in: [VerificationStatusEnum.REJECTED, VerificationStatusEnum.REQUIRES_REUPLOAD]
      },
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
    }    // Get users with rejected documents (unique to user)
    const usersWithRejectedDocuments = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: {
              not: {
                in: ['ADMIN', 'SUPER_ADMIN'],
              },
            },
          },
          {
            kycDocuments: {
              some: where,
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        kycDocuments: {
          where,
          orderBy: {
            verifiedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get the total count of users that match the criteria for pagination
    const totalCount = usersWithRejectedDocuments.length;

    // Apply pagination to the users array
    const paginatedUsers = usersWithRejectedDocuments.slice(skip, skip + limit);

    // Get all document IDs for audit logs
    const allDocumentIds = paginatedUsers.flatMap(user => 
      user.kycDocuments.map(doc => doc.id)
    );

    // Get audit logs for all rejected documents
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetId: { in: allDocumentIds },
        action: { contains: 'REJECT', mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response for the UI - one entry per user with their most recent rejected document
    const formattedRejectedSubmissions = paginatedUsers.map(user => {
      // Get the most recent rejected document
      const mostRecentDoc = user.kycDocuments[0];
      if (!mostRecentDoc) return null;
      
      // Find the audit log for this document
      const rejectionLog = auditLogs.find(log => log.targetId === mostRecentDoc.id);
      // Check if document status is REQUIRES_REUPLOAD
      const isReuploadStatus = mostRecentDoc.status === VerificationStatusEnum.REQUIRES_REUPLOAD;

      return {
        id: mostRecentDoc.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        documentType: `${user.kycDocuments.length} Rejected Document${user.kycDocuments.length !== 1 ? 's' : ''}`,
        dateSubmitted: mostRecentDoc.uploadedAt.toISOString(),
        dateRejected: mostRecentDoc.verifiedAt?.toISOString() || null,
        status: mostRecentDoc.status,
        statusFormatted: isReuploadStatus ? 'REQUIRES REUPLOAD' : 'REJECTED',
        fileName: mostRecentDoc.fileName,
        rejectedBy: mostRecentDoc.verifiedBy || rejectionLog?.userId || 'Admin User',
        rejectionReason: mostRecentDoc.notes || 'Document rejected',
        allowReupload: isReuploadStatus,
        totalRejectedDocuments: user.kycDocuments.length,
        submissionType: 'rejected-documents'
      };
    }).filter(Boolean);

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
