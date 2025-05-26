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

    // Get submission with related documents and selfie verification
    const submission = await prisma.kYCSubmission.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        KYCDocument: true,
        SelfieVerification: true,
      },
    });

    if (!submission) {
      return new NextResponse(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404 }
      );
    }

    // Format documents
    const documents = submission.KYCDocument.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      fileName: doc.fileName,
      uploadedAt: doc.createdAt.toISOString(),
      status: doc.status,
      notes: doc.notes || undefined,
    }));

    // Format selfie verification
    const selfieVerification = submission.SelfieVerification.length > 0 
      ? {
          id: submission.SelfieVerification[0].id,
          status: submission.SelfieVerification[0].status,
          uploadedAt: submission.SelfieVerification[0].createdAt.toISOString(),
        }
      : null;

    // Format response
    const formattedSubmission = {
      id: submission.id,
      userId: submission.userId,
      userName: `${submission.user.firstName} ${submission.user.lastName}`,
      submissionDate: submission.createdAt.toISOString(),
      status: submission.status,
      documents,
      selfieVerification,
      notes: submission.notes || '',
    };

    // Log this access in audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMISSION_VIEW',
        details: `Viewed submission details for ${submission.user.firstName} ${submission.user.lastName}`,
        targetId: submission.id,
        targetType: 'KYC_SUBMISSION',
      },
    });

    return new NextResponse(
      JSON.stringify(formattedSubmission),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('SUBMISSION_DETAILS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching submission details',
      }),
      { status: 500 }
    );
  }
}