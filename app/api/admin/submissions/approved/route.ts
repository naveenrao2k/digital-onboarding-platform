// app/api/admin/submissions/approved/route.ts
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

    // Build where clause specifically for approved documents
    const where: any = {
      status: VerificationStatusEnum.APPROVED,
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
    }    // Get approved documents AND SCUML submissions
    const approvedDocuments = await prisma.kYCDocument.findMany({
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

    // Also get SCUML submissions with APPROVED verification status
    const approvedSCUMLUsers = await prisma.user.findMany({
      where: {
        role: {
          not: {
            in: ['ADMIN', 'SUPER_ADMIN'],
          },
        },
        kycFormData: {
          scumlNumber: {
            not: null,
          },
          // Only consider SCUML numbers for business accounts
          accountType: {
            in: ['PARTNERSHIP', 'ENTERPRISE', 'LLC']
          }
        },
        // Don't include users who have any KYC documents (like fvkohn)
        // This ensures only pure SCUML users without document uploads are included
        kycDocuments: {
          none: {},
        },
      },
      include: {
        kycFormData: {
          select: {
            id: true,
            scumlNumber: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Find the audit logs for these documents to get approval information
    const documentIds = approvedDocuments.map(doc => doc.id);
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetId: { in: documentIds },
        action: { contains: 'APPROVE', mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response for the UI - combine documents and SCUML submissions
    const formattedDocumentSubmissions = approvedDocuments.map(doc => {
      // Find the most recent audit log entry for this document's approval
      const approvalLog = auditLogs.find(log => log.targetId === doc.id);

      return {
        id: doc.id,
        userId: doc.userId,
        userName: `${doc.user.firstName} ${doc.user.lastName}`,
        userEmail: doc.user.email,
        documentType: doc.type,
        dateSubmitted: doc.uploadedAt.toISOString(),
        dateApproved: doc.verifiedAt?.toISOString() || null,
        status: doc.status,
        fileName: doc.fileName,
        approvedBy: doc.verifiedBy || approvalLog?.userId || 'Admin User',
        notes: doc.notes || '',
        submissionType: 'documents',
      };
    });

    // Format SCUML submissions
    const formattedSCUMLSubmissions = approvedSCUMLUsers.map(user => {
      const scumlData = user.kycFormData;
      return {
        id: `scuml-${scumlData?.id}`,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        documentType: 'SCUML License',
        dateSubmitted: scumlData?.createdAt.toISOString() || user.createdAt.toISOString(),
        dateApproved: scumlData?.createdAt.toISOString() || user.createdAt.toISOString(),
        status: 'APPROVED',
        fileName: `SCUML: ${scumlData?.scumlNumber}`,
        approvedBy: 'System (Auto-approved)',
        notes: 'Automatically approved via SCUML license verification',
        submissionType: 'scuml',
        scumlNumber: scumlData?.scumlNumber,
      };
    });

    // Combine and sort all submissions by date
    const allApprovedSubmissions = [...formattedDocumentSubmissions, ...formattedSCUMLSubmissions]
      .sort((a, b) => new Date(b.dateApproved || b.dateSubmitted).getTime() - new Date(a.dateApproved || a.dateSubmitted).getTime());

    // Apply pagination to the combined results
    const paginatedResults = allApprovedSubmissions.slice(skip, skip + limit);
    const totalCount = allApprovedSubmissions.length;

    return NextResponse.json({
      data: paginatedResults,
      pagination: {
        total: totalCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });
  } catch (error: any) {
    console.error('FETCH_APPROVED_SUBMISSIONS_ERROR', error);

    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching approved submissions',
      }),
      { status: 500 }
    );
  }
}
