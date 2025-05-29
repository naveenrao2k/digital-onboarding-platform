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

export async function PUT(
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

    // Get request body
    const body = await request.json();
    const { status, documentId, documentStatus, selfieId, selfieStatus, notes } = body;

    // Get submission user
    const submissionUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        kycDocuments: true,
        selfieVerification: true,
      },
    });

    if (!submissionUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404 }
      );
    }

    // Update submission status if provided
    if (status) {
      // No direct submission model, so this part may need adjustment or removal
      // Assuming status is stored elsewhere or needs custom handling
      // For now, skipping update of submission status

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId,
          action: `SUBMISSION_${status}`,
          details: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} submission for ${submissionUser.firstName} ${submissionUser.lastName}`,
          targetId: submissionUser.id,
          targetType: 'KYC_SUBMISSION',
        },
      });
    }

    // Update document status if provided
    if (documentId && documentStatus) {
      // Check if document exists and belongs to the user
      const document = await prisma.kYCDocument.findFirst({
        where: {
          id: documentId,
          userId: submissionUser.id,
        },
      });

      if (!document) {
        return new NextResponse(
          JSON.stringify({ error: 'Document not found or does not belong to the submission' }),
          { status: 404 }
        );
      }

      // Update document status
      await prisma.kYCDocument.update({
        where: { id: documentId },
        data: {
          status: documentStatus,
          notes: notes || undefined,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId,
          action: documentStatus === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
          details: `${documentStatus === 'APPROVED' ? 'Approved' : 'Rejected'} ${document.type} for ${submissionUser.firstName} ${submissionUser.lastName}${notes ? ` - ${notes}` : ''}`,
          targetId: document.id,
          targetType: 'KYC_DOCUMENT',
        },
      });
    }

    // Update selfie status if provided
    if (selfieId && selfieStatus) {
      // Check if selfie exists and belongs to the user
      const selfie = await prisma.selfieVerification.findFirst({
        where: {
          id: selfieId,
          userId: submissionUser.id,
        },
      });

      if (!selfie) {
        return new NextResponse(
          JSON.stringify({ error: 'Selfie not found or does not belong to the submission' }),
          { status: 404 }
        );
      }

      // Update selfie status
      await prisma.selfieVerification.update({
        where: { id: selfieId },
        data: {
          status: selfieStatus,
          notes: notes || undefined,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId,
          action: selfieStatus === 'APPROVED' ? 'SELFIE_APPROVED' : 'SELFIE_REJECTED',
          details: `${selfieStatus === 'APPROVED' ? 'Approved' : 'Rejected'} selfie verification for ${submissionUser.firstName} ${submissionUser.lastName}${notes ? ` - ${notes}` : ''}`,
          targetId: selfie.id,
          targetType: 'SELFIE_VERIFICATION',
        },
      });
    }


    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('SUBMISSION_UPDATE_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while updating submission',
      }),
      { status: 500 }
    );
  }
}
