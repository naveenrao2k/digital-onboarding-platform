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
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!adminUser || !['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401 }
      );
    }

    // Get submission with related documents and selfie verification
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


    // Format documents
    const documents = submissionUser.kycDocuments.map(doc => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      uploadedAt: doc.uploadedAt.toISOString(),
      status: doc.status,
      notes: doc.notes || undefined,
    }));

    // Format selfie verification
    const selfieVerification = submissionUser.selfieVerification
      ? {
          id: submissionUser.selfieVerification.id,
          status: submissionUser.selfieVerification.status,
          uploadedAt: submissionUser.selfieVerification.capturedAt.toISOString(),
        }
      : null;

    // Format response
    const formattedSubmission = {
      id: submissionUser.id,
      userId: submissionUser.id,
      userName: `${submissionUser.firstName} ${submissionUser.lastName}`,
      submissionDate: submissionUser.createdAt?.toISOString() || '',
      status: '', // No status field on user, set empty or adjust as needed
      documents,
      selfieVerification,
      notes: '', // No notes field on user, set empty or adjust as needed
    };
    // Log this access in audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMISSION_VIEW',
        details: `Viewed submission details for ${submissionUser.firstName} ${submissionUser.lastName}`,
        targetId: submissionUser.id,
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
