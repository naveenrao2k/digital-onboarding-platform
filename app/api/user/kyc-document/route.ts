// app/api/user/kyc-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadKycDocument } from '@/lib/kyc-service';
import { DocumentType } from '@/app/generated/prisma';
import { 
  handleApiError, 
  AuthenticationError, 
  ValidationError,
  validateRequired,
  validateFileSize,
  validateFileType
} from '@/lib/error-handler';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

// Helper to get the current user ID from cookies with enhanced validation
const getCurrentUserId = (): string | null => {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;
    
    const session = JSON.parse(sessionCookie);
    const userId = session.userId;
    
    // Validate userId format (assuming it's a UUID or similar)
    if (!userId || typeof userId !== 'string') {
      return null;
    }
    
    return userId;
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      throw new AuthenticationError('Valid session required to upload documents');
    }

    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      throw new ValidationError('Invalid form data provided');
    }
    
    const documentTypeString = formData.get('documentType') as string;
    const file = formData.get('file') as File;
    
    // Validate required fields
    validateRequired(documentTypeString, 'documentType');
    validateRequired(file, 'file');
    
    // Additional file validation
    if (!file || !(file instanceof File)) {
      throw new ValidationError('Valid file is required');
    }
    
    // Validate file before document type validation
    validateFileSize(file, 10); // 10MB limit
    validateFileType(file, ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']);
    
    // Validate document type enum
    if (!Object.values(DocumentType).includes(documentTypeString as DocumentType)) {
      throw new ValidationError(
        `Invalid document type: ${documentTypeString}. Valid types are: ${Object.values(DocumentType).join(', ')}`
      );
    }
    
    const documentType = documentTypeString as DocumentType;
    
    // Log the upload attempt for monitoring
    console.log('KYC_DOCUMENT_UPLOAD_ATTEMPT', {
      userId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      timestamp: new Date().toISOString()
    });
    
    // Upload the document
    const document = await uploadKycDocument({
      userId,
      documentType,
      file,
    });
    
    // Log successful upload
    console.log('KYC_DOCUMENT_UPLOAD_SUCCESS', {
      userId,
      documentId: document.id,
      documentType,
      fileName: file.name,
      timestamp: new Date().toISOString()
    });
    
    // Return the document with safe data (no sensitive info)
    return NextResponse.json({
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      fileSize: document.fileSize,
      status: document.status,
      uploadedAt: document.uploadedAt,
      message: 'Document uploaded successfully'
    });
    
  } catch (error: any) {
    // Use centralized error handler
    return handleApiError(error);
  }
}

// GET endpoint to retrieve document status
export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      throw new AuthenticationError('Valid session required to view documents');
    }
    
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (documentId) {
      // Get specific document
      const { getUserDocuments } = await import('@/lib/kyc-service');
      const documents = await getUserDocuments(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        throw new ValidationError('Document not found');
      }
      
      return NextResponse.json(document);
    } else {
      // Get all user documents
      const { getUserDocuments } = await import('@/lib/kyc-service');
      const documents = await getUserDocuments(userId);
      
      return NextResponse.json({
        documents,
        count: documents.length
      });
    }
    
  } catch (error: any) {
    return handleApiError(error);
  }
}

// DELETE endpoint to remove documents (for non-approved documents only)
export async function DELETE(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      throw new AuthenticationError('Valid session required to delete documents');
    }
    
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    validateRequired(documentId, 'documentId');
    
    const { deleteUserDocument } = await import('@/lib/kyc-service');
    const result = await deleteUserDocument(userId, documentId!);
    
    console.log('KYC_DOCUMENT_DELETE_SUCCESS', {
      userId,
      documentId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error: any) {
    return handleApiError(error);
  }
}
