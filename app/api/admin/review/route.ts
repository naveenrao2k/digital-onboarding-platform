// app/api/admin/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { 
  $Enums,
  AdminReviewStatus,
  AdminReviewType,
  VerificationStatusEnum 
} from '@/app/generated/prisma';

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

const isAdmin = (): boolean => {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return false;
  
  try {
    const session = JSON.parse(sessionCookie);
    return session.isAdmin || false;
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin()) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403 }
      );
    }

    const reviewerId = getCurrentUserId();
    if (!reviewerId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      userId,
      documentId,
      verificationType,
      dojahVerificationId,
      status,
      reviewNotes,
      rejectionReason,
      allowReupload
    } = body;

    // Create admin review
    const review = await prisma.adminReview.create({
      data: {
        userId,
        reviewerId,
        documentId,
        verificationType: verificationType as AdminReviewType,
        dojahVerificationId,
        status: status as AdminReviewStatus,
        reviewNotes,
        rejectionReason,
        allowReupload: allowReupload || false
      }
    });

    // Update document status based on review
    if (verificationType === 'DOCUMENT_VERIFICATION' && documentId) {
      const newStatus = status === 'APPROVED' ? 
        VerificationStatusEnum.APPROVED : 
        status === 'REJECTED' ? 
          (allowReupload ? VerificationStatusEnum.REQUIRES_REUPLOAD : VerificationStatusEnum.REJECTED) :
          VerificationStatusEnum.IN_PROGRESS;

      await prisma.kYCDocument.update({
        where: { id: documentId },
        data: {
          status: newStatus,
          verified: status === 'APPROVED',
          verifiedAt: status === 'APPROVED' ? new Date() : null,
          verifiedBy: reviewerId,
          notes: reviewNotes
        }
      });
    }

    if (verificationType === 'SELFIE_VERIFICATION' && documentId) {
      const newStatus = status === 'APPROVED' ? 
        VerificationStatusEnum.APPROVED : 
        status === 'REJECTED' ? 
          (allowReupload ? VerificationStatusEnum.REQUIRES_REUPLOAD : VerificationStatusEnum.REJECTED) :
          VerificationStatusEnum.IN_PROGRESS;

      await prisma.selfieVerification.update({
        where: { id: documentId },
        data: {
          status: newStatus,
          verified: status === 'APPROVED',
          verifiedAt: status === 'APPROVED' ? new Date() : null,
          verifiedBy: reviewerId,
          notes: reviewNotes
        }
      });
    }

    // Update overall verification status
    await updateOverallVerificationStatus(userId);

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        title: `Document Review ${status}`,
        message: status === 'APPROVED' ? 
          'Your document has been approved!' :
          status === 'REJECTED' ?
            `Your document was rejected: ${rejectionReason}${allowReupload ? ' Please reupload.' : ''}` :
            'Your document is under review.',
        type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO'
      }
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Review completed successfully'
    });
  } catch (error: any) {
    console.error('ADMIN_REVIEW_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during review',
      }),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin()) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (type) where.verificationType = type;

    const reviews = await prisma.adminReview.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        dojahVerification: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('GET_REVIEWS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching reviews',
      }),
      { status: 500 }
    );
  }
}

async function updateOverallVerificationStatus(userId: string) {
  // Get all documents and selfie for the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      kycDocuments: true,
      selfieVerification: true,
      verificationStatus: true
    }
  });

  if (!user) return;

  const allDocuments = user.kycDocuments;
  const selfie = user.selfieVerification;

  // Calculate KYC status
  const kycStatus = allDocuments.length === 0 ? 
    VerificationStatusEnum.PENDING :
    allDocuments.every(doc => doc.status === VerificationStatusEnum.APPROVED) ?
      VerificationStatusEnum.APPROVED :
      allDocuments.some(doc => doc.status === VerificationStatusEnum.REJECTED) ?
        VerificationStatusEnum.REJECTED :
        allDocuments.some(doc => doc.status === VerificationStatusEnum.REQUIRES_REUPLOAD) ?
          VerificationStatusEnum.REQUIRES_REUPLOAD :
          VerificationStatusEnum.IN_PROGRESS;

  // Calculate selfie status
  const selfieStatus = !selfie ? 
    VerificationStatusEnum.PENDING : 
    selfie.status;

  // Calculate overall status
  const overallStatus = 
    kycStatus === VerificationStatusEnum.APPROVED && selfieStatus === VerificationStatusEnum.APPROVED ?
      VerificationStatusEnum.APPROVED :
      kycStatus === VerificationStatusEnum.REJECTED || selfieStatus === VerificationStatusEnum.REJECTED ?
        VerificationStatusEnum.REJECTED :
        kycStatus === VerificationStatusEnum.REQUIRES_REUPLOAD || selfieStatus === VerificationStatusEnum.REQUIRES_REUPLOAD ?
          VerificationStatusEnum.REQUIRES_REUPLOAD :
          VerificationStatusEnum.IN_PROGRESS;

  // Calculate progress
  let progress = 0;
  if (allDocuments.length > 0) progress += 50;
  if (selfie) progress += 25;
  if (kycStatus === VerificationStatusEnum.APPROVED) progress += 15;
  if (selfieStatus === VerificationStatusEnum.APPROVED) progress += 10;

  // Update verification status
  await prisma.verificationStatus.upsert({
    where: { userId },
    update: {
      kycStatus,
      selfieStatus,
      overallStatus,
      progress: Math.min(progress, 100),
      updatedAt: new Date()
    },
    create: {
      userId,
      kycStatus,
      selfieStatus,
      overallStatus,
      progress: Math.min(progress, 100)
    }
  });
}