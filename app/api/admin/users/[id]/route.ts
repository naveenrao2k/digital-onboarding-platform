import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Mark this route as dynamic
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get user details
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        KYCDocument: true,
        SelfieVerification: true,
      },
    });

    if (!targetUser) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Calculate verification status
    const kycStatus = targetUser.KYCDocument.length > 0 
      ? targetUser.KYCDocument.every(doc => doc.status === 'APPROVED') 
        ? 'APPROVED' 
        : targetUser.KYCDocument.some(doc => doc.status === 'REJECTED') 
          ? 'REJECTED' 
          : 'PENDING'
      : 'PENDING';

    const selfieStatus = targetUser.SelfieVerification.length > 0
      ? targetUser.SelfieVerification[0].status
      : 'PENDING';

    const overallStatus = kycStatus === 'APPROVED' && selfieStatus === 'APPROVED'
      ? 'APPROVED'
      : kycStatus === 'REJECTED' || selfieStatus === 'REJECTED'
        ? 'REJECTED'
        : 'IN_PROGRESS';

    // Calculate progress percentage
    let progress = 0;
    if (targetUser.KYCDocument.length > 0) progress += 50;
    if (targetUser.SelfieVerification.length > 0) progress += 15;
    if (kycStatus === 'APPROVED') progress += 15;
    if (selfieStatus === 'APPROVED') progress += 20;

    // Format documents
    const documents = targetUser.KYCDocument.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      fileName: doc.fileName,
      uploadedAt: doc.createdAt.toISOString(),
      status: doc.status,
    }));

    // Add selfie as a document if it exists
    if (targetUser.SelfieVerification.length > 0) {
      const selfie = targetUser.SelfieVerification[0];
      documents.push({
        id: selfie.id,
        type: 'Selfie Verification',
        fileName: 'selfie.jpg',
        uploadedAt: selfie.createdAt.toISOString(),
        status: selfie.status,
      });
    }

    // Format response
    const userDetails = {
      id: targetUser.id,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      email: targetUser.email,
      phone: targetUser.phone,
      address: targetUser.address,
      dateOfBirth: targetUser.dateOfBirth ? targetUser.dateOfBirth.toISOString().split('T')[0] : null,
      accountType: targetUser.accountType,
      accountStatus: targetUser.status,
      createdAt: targetUser.createdAt.toISOString().split('T')[0],
      verificationStatus: {
        overallStatus,
        kycStatus,
        selfieStatus,
        progress,
      },
      documents,
    };

    // Log this access in audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_PROFILE_VIEW',
        details: `Viewed user profile: ${targetUser.firstName} ${targetUser.lastName}`,
        targetId: targetUser.id,
        targetType: 'USER',
      },
    });

    return new NextResponse(
      JSON.stringify(userDetails),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('USER_DETAILS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching user details',
      }),
      { status: 500 }
    );
  }
}