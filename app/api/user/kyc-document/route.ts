// app/api/user/kyc-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadKycDocument } from '@/lib/kyc-service';
import { DocumentType } from '@/app/generated/prisma';



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
    const documentTypeString = formData.get('documentType') as string;
    const file = formData.get('file') as File;

    if (!documentTypeString || !file) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Validate that the document type is one of the valid enum values
    let documentType: DocumentType;
    try {
      // Make sure it's a valid DocumentType enum value
      if (!Object.values(DocumentType).includes(documentTypeString as any)) {
        return new NextResponse(
          JSON.stringify({
            error: `Invalid document type: ${documentTypeString}. Valid types are: ${Object.values(DocumentType).join(', ')}`
          }),
          { status: 400 }
        );
      }
      documentType = documentTypeString as DocumentType;
    } catch (e) {
      return new NextResponse(
        JSON.stringify({
          error: `Invalid document type: ${documentTypeString}. Valid types are: ${Object.values(DocumentType).join(', ')}`
        }),
        { status: 400 }
      );
    }

    const result = await uploadKycDocument({
      userId,
      documentType,
      file,
    });

    if (!result) {
      return new NextResponse(
        JSON.stringify({ error: 'Document upload failed' }),
        { status: 500 }
      );
    }

    // console.log('KingRao', result);

    let documentTypeMismatchNote;
    let documentData;
    if (typeof result === 'object' && result !== null && 'documentTypeMismatchNote' in result) {
      documentTypeMismatchNote = result.documentTypeMismatchNote;
      documentData = { ...result };

      if (documentTypeMismatchNote) {
        return new NextResponse(
          JSON.stringify({
            error: documentTypeMismatchNote,
          }),
          { status: 500 }
        );
      }

    } else {
      documentData = result;
    }

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('KYC_DOCUMENT_UPLOAD_ERROR', error);

    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during document upload',
      }),
      { status: 500 }
    );
  }
}
