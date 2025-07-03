// app/api/admin/submissions/route.ts
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
    const status = searchParams.get('status');
    const documentType = searchParams.get('documentType');
    const searchQuery = searchParams.get('search');
    const dateFilter = searchParams.get('dateFilter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status as VerificationStatusEnum;
    }

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
          where.uploadedAt = {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          };
          break;
        case 'week':
          where.uploadedAt = {
            gte: new Date(now.setDate(now.getDate() - 7)),
          };
          break;
        case 'month':
          where.uploadedAt = {
            gte: new Date(now.setMonth(now.getMonth() - 1)),
          };
          break;
      }
    }    // Get users with either KYC documents OR SCUML submissions
    const usersWithDocuments = await prisma.user.findMany({
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
            OR: [
              // Users with KYC documents
              {
                kycDocuments: {
                  some: where,
                },
              },
              // Users with SCUML submissions (if no document filters are applied)
              ...(Object.keys(where).length === 0 || (!where.type && !where.fileName) ? [{
                kycFormData: {
                  scumlNumber: {
                    not: null,
                  },
                },
              }] : []),
            ],
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
            uploadedAt: 'desc',
          },
        },
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

    // Get the total count of users that match the criteria for pagination
    const totalCount = usersWithDocuments.length;

    // Apply pagination to the users array
    const paginatedUsers = usersWithDocuments.slice(skip, skip + limit);

    // Format the data for the frontend
    const formattedSubmissions = paginatedUsers.map(user => {
      const hasDocuments = user.kycDocuments.length > 0;
      const hasSCUML = user.kycFormData?.scumlNumber;

      if (hasDocuments) {
        // User with documents
        const mostRecentDoc = user.kycDocuments[0];
        return {
          id: mostRecentDoc.id,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          documentType: `${user.kycDocuments.length} Document${user.kycDocuments.length !== 1 ? 's' : ''}`,
          dateSubmitted: mostRecentDoc.uploadedAt,
          status: mostRecentDoc.status,
          fileName: mostRecentDoc.fileName,
          totalDocuments: user.kycDocuments.length,
          submissionType: 'documents',
        };
      } else if (hasSCUML && user.kycFormData) {
        // User with SCUML only
        const scumlData = user.kycFormData;
        return {
          id: `scuml-${scumlData.id}`,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          documentType: 'SCUML License',
          dateSubmitted: scumlData.createdAt,
          status: 'APPROVED', // SCUML submissions are automatically approved
          fileName: `SCUML: ${scumlData.scumlNumber}`,
          totalDocuments: 0,
          scumlNumber: scumlData.scumlNumber,
          submissionType: 'scuml',
        };
      }

      return null;
    }).filter(Boolean);

    return NextResponse.json({
      data: formattedSubmissions,
      pagination: {
        total: totalCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });
  } catch (error: any) {
    console.error('FETCH_SUBMISSIONS_ERROR', error);

    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching submissions',
      }),
      { status: 500 }
    );
  }
}
