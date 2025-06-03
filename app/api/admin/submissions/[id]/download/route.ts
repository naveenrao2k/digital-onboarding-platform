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

    // Get document
    const document = await prisma.kYCDocument.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return new NextResponse(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404 }
      );
    }

    // Log the download in audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DOCUMENT_DOWNLOAD',
        details: `Downloaded document: ${document.fileName}`,
        targetId: document.id,
        targetType: 'KYC_DOCUMENT',
      },
    });

    // Redirect to S3 URL
    return NextResponse.redirect(document.fileUrl);
  } catch (error: any) {
    console.error('DOCUMENT_DOWNLOAD_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while downloading the document',
      }),
      { status: 500 }
    );
  }
}