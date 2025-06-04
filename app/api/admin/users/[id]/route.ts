// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const isAdmin = (request: NextRequest): boolean => {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) return false;

  try {
    const session = JSON.parse(sessionCookie);
    return session.isAdmin || false;
  } catch {
    return false;
  }
};

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized - Admin access required' }),
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verificationStatus: true,
        kycDocuments: true,
        selfieVerification: true,
        dojahVerifications: true,
        adminReviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Transform data to match client expectations if needed
    const responseData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || null,
      address: user.address || null,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : null,
      accountType: user.accountType,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt.toISOString(),
      verificationStatus: user.verificationStatus,
      documents: user.kycDocuments.map(doc => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        uploadedAt: doc.fileUrl ? null : null, // createdAt does not exist, fileUrl used as placeholder
        status: doc.status,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        // Removed documentAnalysis and dojahVerification as they do not exist on doc
      })),
      dojahVerifications: user.dojahVerifications,
      adminReviews: user.adminReviews.map(review => ({
        id: review.id,
        verificationType: review.verificationType,
        status: review.status,
        reviewNotes: review.reviewNotes,
        rejectionReason: review.rejectionReason,
        allowReupload: review.allowReupload,
        reviewer: review.reviewer,
        createdAt: review.createdAt.toISOString(),
      })),
      // Removed canReupload as it does not exist on user
    };


    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('GET_USER_DETAILS_ERROR', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'An error occurred while fetching user details' }),
      { status: 500 }
    );
  }
}
