// app/api/admin/submissions/flagged/route.ts
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
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('documentType');
    const searchQuery = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause specifically for flagged documents
    const where: any = {
      // Marked as IN_PROGRESS but with additional flags
      status: VerificationStatusEnum.IN_PROGRESS,
      // We check for submissions with notes - this indicates a flagged document
      // In a real system you might have a specific 'flagged' field
      NOT: { 
        notes: null 
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
    }    // Get the total count of documents matching the criteria
    const totalCount = await prisma.kYCDocument.count({ where });

    // Get documents with flags that require admin attention
    const flaggedDocuments = await prisma.kYCDocument.findMany({
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
        uploadedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Find the audit logs for these documents to get flagging information
    const documentIds = flaggedDocuments.map(doc => doc.id);
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetId: { in: documentIds },
        action: { contains: 'FLAG', mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response for the UI
    const formattedFlaggedSubmissions = flaggedDocuments.map(doc => {
      // Find the most recent audit log entry for this document's flag
      const flagLog = auditLogs.find(log => log.targetId === doc.id);
      
      return {
        id: doc.id,
        userId: doc.userId,
        userName: `${doc.user.firstName} ${doc.user.lastName}`,
        userEmail: doc.user.email,
        documentType: doc.type,
        dateSubmitted: doc.uploadedAt.toISOString(),
        status: doc.status,
        fileName: doc.fileName,
        flagReason: doc.notes || 'Document requires review',
        flaggedAt: flagLog ? flagLog.createdAt.toISOString() : doc.uploadedAt.toISOString(),
        flaggedBy: flagLog?.details?.includes('System') ? 'System' : 'Admin User',
      };
    });

    return NextResponse.json({
      data: formattedFlaggedSubmissions,
      pagination: {
        total: totalCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });
  } catch (error: any) {
    console.error('FETCH_FLAGGED_SUBMISSIONS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching flagged submissions',
      }),
      { status: 500 }
    );
  }
}
