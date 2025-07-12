// app/api/user/document-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dojahService from '@/lib/dojah-service';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

// Helper to get the current user ID from cookies
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

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const documentId = formData.get('documentId') as string;
    const documentBase64 = formData.get('documentBase64') as string;
    const documentType = formData.get('documentType') as string;
    
    if (!documentId || !documentBase64 || !documentType) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }
    
    const result = await dojahService.verifyDocument(
      userId,
      documentId,
      documentBase64,
      documentType
    );
    let verificationId: string | undefined;
    let documentTypeMismatchNote: string | undefined;
    const res: any = result;
    if (typeof res === 'object' && res !== null && 'verificationId' in res) {
      verificationId = res.verificationId;
      documentTypeMismatchNote = res.documentTypeMismatchNote;
    } else {
      verificationId = res;
    }
    return NextResponse.json({ 
      success: true, 
      verificationId,
      documentTypeMismatchNote,
      message: 'Document analysis initiated successfully' 
    });
  } catch (error: any) {
    console.error('DOCUMENT_ANALYSIS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during document analysis',
      }),
      { status: 500 }
    );
  }
}