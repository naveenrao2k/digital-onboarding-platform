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
    const { accountStatus, documentId, documentStatus, notes } = body;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Update user account status if provided
    if (accountStatus) {
      await prisma.user.update({
        where: { id: params.id },
        data: { status: accountStatus },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_STATUS_CHANGE',
          details: `Changed user status to ${accountStatus} for ${targetUser.firstName} ${targetUser.lastName}`,
          targetId: targetUser.id,
          targetType: 'USER',
        },
      });
    }

    // Update document status if provided
    if (documentId && documentStatus) {
      // Check if document exists and belongs to the user
      const document = await prisma.kYCDocument.findFirst({
        where: {
          id: documentId,
          userId: params.id,
        },
      });

      if (!document) {
        return new NextResponse(
          JSON.stringify({ error: 'Document not found or does not belong to the user' }),
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
          details: `${documentStatus === 'APPROVED' ? 'Approved' : 'Rejected'} ${document.documentType} for ${targetUser.firstName} ${targetUser.lastName}${notes ? ` - ${notes}` : ''}`,
          targetId: document.id,
          targetType: 'KYC_DOCUMENT',
        },
      });
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('USER_UPDATE_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while updating user',
      }),
      { status: 500 }
    );
  }
}