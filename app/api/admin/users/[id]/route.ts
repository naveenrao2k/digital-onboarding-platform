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
        kycFormData: true, // Include KYC form data for SCUML information
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
    console.log('GET_USER_DETAILS', user);

    // Check if user has SCUML license
    const hasSCUML = user.kycFormData?.scumlNumber;

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
      scumlNumber: user.kycFormData?.scumlNumber || null, // Add SCUML number
      tinNumber: user.kycFormData?.taxNumber || null, // Add TIN number
      rcNumber: user.kycFormData?.rcNumber || null, // Add RC number
      cacCompanyData: (user.kycFormData?.extractedData as any)?.cacCompanyData || null, // Add CAC validation data
      businessName: user.kycFormData?.businessName || null, // Add business name
      businessAddress: user.kycFormData?.businessAddress || null, // Add business address
      verificationStatus: hasSCUML ? {
        ...user.verificationStatus,
        kycStatus: 'APPROVED', // Override KYC status for SCUML users
        overallStatus: 'APPROVED', // Ensure overall status is approved
      } : user.verificationStatus,
      selfieVerification: user.selfieVerification ? {
        id: user.selfieVerification.id,
        status: user.selfieVerification.status,
        fileUrl: user.selfieVerification.fileUrl,
        fileName: user.selfieVerification.fileName,
        mimeType: user.selfieVerification.mimeType,
        fileSize: user.selfieVerification.fileSize,
        capturedAt: user.selfieVerification.capturedAt ? user.selfieVerification.capturedAt.toISOString() : null,
      } : null,
      documentDetails: user.kycDocuments, documents: user.kycDocuments.map(doc => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt ? doc.uploadedAt.toISOString() : null,
        status: doc.status,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        // Removed documentAnalysis and dojahVerification as they do not exist on doc
      })), dojahVerifications: {
        total: user.dojahVerifications?.length || 0,
        governmentVerifications: user.dojahVerifications?.filter(v =>
          ['BVN_LOOKUP', 'NIN_LOOKUP', 'PASSPORT_LOOKUP', 'DRIVERS_LICENSE_LOOKUP'].includes(v.verificationType)
        ) || [],
        amlScreenings: user.dojahVerifications?.filter(v => v.verificationType === 'AML_SCREENING') || [],
      },
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

    console.log('GET_USER_DETAILS_SUCCESS', responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('GET_USER_DETAILS_ERROR', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'An error occurred while fetching user details' }),
      { status: 500 }
    );
  }
}
