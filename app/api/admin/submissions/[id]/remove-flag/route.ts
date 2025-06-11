// app/api/admin/submissions/[id]/remove-flag/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get admin user ID from session
    const adminUserId = getCurrentUserId();
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session' }, 
        { status: 401 }
      );
    }

    // Verify the user is an admin
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true },
    });

    if (!adminUser || !['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' }, 
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' }, 
        { status: 400 }
      );
    }

    // Get the document to verify it exists
    const document = await prisma.kYCDocument.findFirst({
      where: {
        id: documentId,
        userId: params.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' }, 
        { status: 404 }
      );
    }

    // Remove the flag by clearing the notes field
    const updatedDocument = await prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        notes: null, // Clear the flag
      },
    });

    // Log the action in audit trail
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'FLAG_REMOVED',
        details: `Flag removed from document ${documentId}`,
        targetId: documentId,
        targetType: 'KYC_DOCUMENT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Flag removed successfully',
      document: {
        id: updatedDocument.id,
        status: updatedDocument.status,
      },
    });
  } catch (error) {
    console.error('REMOVE_FLAG_ERROR', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to remove flag' }, 
      { status: 500 }
    );
  }
}
