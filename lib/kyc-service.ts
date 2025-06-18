// lib/kyc-service.ts
import { prisma, withRetry, checkDatabaseConnection } from './prisma';
import { DocumentType, VerificationStatusEnum } from '../app/generated/prisma';
import { uploadFileToS3, generateFileKey, deleteFileFromS3 } from './s3-service';
import { 
  handlePrismaError, 
  DatabaseError, 
  ValidationError, 
  ServiceUnavailableError,
  validateRequired,
  validateFileSize,
  validateFileType,
  databaseCircuitBreaker
} from './error-handler';

export type KycDocumentUpload = {
  userId: string;
  documentType: DocumentType;
  file: File;
};

export const uploadKycDocument = async ({ userId, documentType, file }: KycDocumentUpload) => {
  console.log(`Starting KYC document upload for user ${userId}, document type: ${documentType}`);
  
  try {
    // Validate inputs
    validateRequired(userId, 'userId');
    validateRequired(documentType, 'documentType');
    validateRequired(file, 'file');
    
    // Validate file
    validateFileSize(file, 10); // 10MB limit
    validateFileType(file, ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']);
    
    // Check database connection before proceeding
    if (!(await checkDatabaseConnection())) {
      throw new ServiceUnavailableError('Database is currently unavailable. Please try again later.');
    }

    // Use circuit breaker for database operations
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        return await performDocumentUpload(userId, documentType, file);
      });
    });
  } catch (error: any) {
    // Enhanced error logging with context
    console.error('KYC_DOCUMENT_UPLOAD_ERROR', {
      userId,
      documentType,
      fileName: file?.name,
      fileSize: file?.size,
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw known errors, handle Prisma errors
    if (error instanceof ValidationError || 
        error instanceof DatabaseError || 
        error instanceof ServiceUnavailableError) {
      throw error;
    }
    
    // Handle Prisma errors
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    // Generic error fallback
    throw new DatabaseError(
      error.message || 'An error occurred during document upload',
      'DOCUMENT_UPLOAD_ERROR'
    );
  }
};

// Separate the main upload logic for better error handling
const performDocumentUpload = async (userId: string, documentType: DocumentType, file: File) => {
  // Check if the verification status is approved - in this case, don't allow any changes
  const verificationStatus = await prisma.verificationStatus.findUnique({
    where: { userId },
  });
  
  // Only if verification is APPROVED, don't allow new uploads
  if (verificationStatus && 
      verificationStatus.overallStatus === VerificationStatusEnum.APPROVED && 
      verificationStatus.kycStatus === VerificationStatusEnum.APPROVED) {
    console.warn(`Upload rejected: User ${userId} already has APPROVED documents`);
    throw new ValidationError('Your documents have already been approved. No further changes allowed.');
  }
  
  // Check if user already has a document of this type
  const existingDocument = await prisma.kYCDocument.findFirst({
    where: {
      userId,
      type: documentType,
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  });
  
  if (existingDocument) {
    console.log(`Found existing ${documentType} document for user ${userId}: ${existingDocument.id}`);
  }

  console.log(`File validation passed: ${file.name} (${file.type}, ${file.size} bytes)`);

  // Generate S3 key for the file
  const s3Key = generateFileKey(userId, documentType.toString(), file.name);
  console.log(`Generated S3 key: ${s3Key}`);
  
  // Convert file to buffer for uploading
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`Starting S3 upload for file: ${file.name}`);
  
  // Upload file to S3 with error handling
  let fileUrl: string;
  try {
    fileUrl = await uploadFileToS3(buffer, s3Key, file.type);
    console.log(`S3 upload successful, URL: ${fileUrl}`);
  } catch (error: any) {
    console.error(`S3 upload failed for user ${userId}:`, error);
    throw new ServiceUnavailableError(`File upload to storage failed: ${error.message || 'Unknown S3 error'}`);
  }

  let kycDocument;

  if (existingDocument) {
    // If a record already exists, update it instead of creating a new one
    kycDocument = await prisma.kYCDocument.update({
      where: { id: existingDocument.id },
      data: {
        fileUrl,
        s3Key,
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name,
        status: VerificationStatusEnum.IN_PROGRESS,
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        /* updatedAt is handled automatically by Prisma */
      },
    });
    
    // Delete the old file from S3 if the key is different
    if (existingDocument.s3Key !== s3Key) {
      try {
        await deleteFileFromS3(existingDocument.s3Key);
        console.log(`Deleted old document file: ${existingDocument.s3Key}`);
      } catch (error) {
        console.error('Failed to delete old document file:', error);
        // Continue even if deletion fails
      }
    }
  } else {
    // Store as a new KYC document if it doesn't exist
    kycDocument = await prisma.kYCDocument.create({
      data: {
        userId,
        type: documentType,
        fileUrl,
        s3Key,
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name,
        status: VerificationStatusEnum.IN_PROGRESS,
      },
    });
  }

  // Trigger Dojah document verification with enhanced error handling
  try {
    console.log(`Triggering Dojah verification for document ID: ${kycDocument.id}`);
    await triggerDojahDocumentVerification(userId, kycDocument.id);
    console.log(`Dojah verification initiated successfully for document ID: ${kycDocument.id}`);
  } catch (error: any) {
    console.error(`Dojah verification failed for document ${kycDocument.id}:`, error);
    
    // Update the KYC document with error status to help with troubleshooting
    try {
      await prisma.kYCDocument.update({
        where: { id: kycDocument.id },
        data: {
          notes: `Verification service error: ${error.message || 'Unknown error'}`,
        },
      });
    } catch (updateError) {
      console.error('Failed to update document with error notes:', updateError);
    }
    
    // Don't fail the upload if Dojah verification fails - document will remain in IN_PROGRESS state
    console.warn(`Document upload succeeded but verification service failed: ${error.message}`);
  }

  // Upsert the verification status with retry logic
  try {
    await prisma.verificationStatus.upsert({
      where: { userId },
      update: {
        kycStatus: VerificationStatusEnum.IN_PROGRESS,
        overallStatus: VerificationStatusEnum.IN_PROGRESS,
        progress: 50,
        updatedAt: new Date(),
      },
      create: {
        userId,
        kycStatus: VerificationStatusEnum.IN_PROGRESS,
        overallStatus: VerificationStatusEnum.IN_PROGRESS,
        progress: 50,
      },
    });
  } catch (error: any) {
    console.error('Failed to update verification status:', error);
    // Don't fail the entire operation if status update fails
  }

  return kycDocument;
};



// Trigger Dojah document verification with enhanced error handling
async function triggerDojahDocumentVerification(
  userId: string, 
  documentId: string, 
  documentBase64?: string, 
  documentType?: string
) {
  try {
    // Import dojahService dynamically to avoid circular dependencies
    const { default: dojahService } = await import('./dojah-service');
    // Let the Dojah service handle getting the file from S3 if needed
    await dojahService.verifyDocument(userId, documentId, documentBase64, documentType);
  } catch (error: any) {
    console.error('Failed to trigger Dojah verification:', error);
    throw new ServiceUnavailableError(`Document verification service failed: ${error.message}`);
  }
}

export const uploadSelfieVerification = async (userId: string, file: File) => {
  console.log(`Starting selfie verification upload for user ${userId}`);
  
  try {
    // Validate inputs
    validateRequired(userId, 'userId');
    validateRequired(file, 'file');
    
    // Validate file for selfie (stricter validation)
    validateFileSize(file, 5); // 5MB limit for selfies
    validateFileType(file, ['image/jpeg', 'image/png', 'image/jpg']);
    
    // Check database connection
    if (!(await checkDatabaseConnection())) {
      throw new ServiceUnavailableError('Database is currently unavailable. Please try again later.');
    }

    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        return await performSelfieUpload(userId, file);
      });
    });
  } catch (error: any) {
    console.error('SELFIE_UPLOAD_ERROR', {
      userId,
      fileName: file?.name,
      fileSize: file?.size,
      error: error.message,
      stack: error.stack
    });
    
    if (error instanceof ValidationError || 
        error instanceof DatabaseError || 
        error instanceof ServiceUnavailableError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    throw new DatabaseError(
      error.message || 'An error occurred during selfie upload',
      'SELFIE_UPLOAD_ERROR'
    );
  }
};

const performSelfieUpload = async (userId: string, file: File) => {
  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { verificationStatus: true }
  });
  
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  // Check if selfie is already approved
  if (user.verificationStatus?.selfieStatus === VerificationStatusEnum.APPROVED) {
    throw new ValidationError('Selfie verification has already been approved. No further changes allowed.');
  }

  console.log(`File validation passed: ${file.name} (${file.type}, ${file.size} bytes)`);

  // Generate S3 key for the selfie
  const s3Key = generateFileKey(userId, 'selfie', file.name);
  console.log(`Generated S3 key: ${s3Key}`);
  
  // Convert file to buffer for uploading
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`Starting S3 upload for selfie: ${file.name}`);
  
  // Upload file to S3
  let fileUrl: string;
  try {
    fileUrl = await uploadFileToS3(buffer, s3Key, file.type);
    console.log(`S3 upload successful, URL: ${fileUrl}`);
  } catch (error: any) {
    console.error(`S3 upload failed for user ${userId}:`, error);
    throw new ServiceUnavailableError(`File upload to storage failed: ${error.message || 'Unknown S3 error'}`);
  }

  // Check if user already has a selfie verification record
  const existingSelfie = await prisma.selfieVerification.findUnique({
    where: { userId }
  });

  let selfieDocument;

  if (existingSelfie) {
    // Update existing selfie
    selfieDocument = await prisma.selfieVerification.update({
      where: { userId },
      data: {
        fileUrl,
        s3Key,
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name,
        status: VerificationStatusEnum.IN_PROGRESS,
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        capturedAt: new Date(),
      },
    });
    
    // Delete old file if different
    if (existingSelfie.s3Key !== s3Key) {
      try {
        await deleteFileFromS3(existingSelfie.s3Key);
        console.log(`Deleted old selfie file: ${existingSelfie.s3Key}`);
      } catch (error) {
        console.error('Failed to delete old selfie file:', error);
      }
    }
  } else {
    // Create new selfie verification record
    selfieDocument = await prisma.selfieVerification.create({
      data: {
        userId,
        fileUrl,
        s3Key,
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name,
        status: VerificationStatusEnum.IN_PROGRESS,
        capturedAt: new Date(),
      },
    });
  }

  // Update verification status
  try {
    await prisma.verificationStatus.upsert({
      where: { userId },
      update: {
        selfieStatus: VerificationStatusEnum.IN_PROGRESS,
        overallStatus: VerificationStatusEnum.IN_PROGRESS,
        progress: Math.max(user.verificationStatus?.progress || 0, 75),
        updatedAt: new Date(),
      },
      create: {
        userId,
        selfieStatus: VerificationStatusEnum.IN_PROGRESS,
        overallStatus: VerificationStatusEnum.IN_PROGRESS,
        progress: 75,
      },
    });
  } catch (error: any) {
    console.error('Failed to update verification status for selfie:', error);
  }

  return selfieDocument;
};

export const getVerificationStatus = async (userId: string) => {
  try {
    validateRequired(userId, 'userId');
    
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        const status = await prisma.verificationStatus.findUnique({
          where: { userId },
          include: {
            user: {
              include: {
                kycDocuments: {
                  orderBy: { uploadedAt: 'desc' }
                }
              }
            }
          }
        });
        
        if (!status) {
          throw new DatabaseError('Verification status not found', 'VERIFICATION_STATUS_NOT_FOUND', 404);
        }
        
        return {
          ...status,
          documents: status.user.kycDocuments.map(doc => ({
            id: doc.id,
            type: doc.type,
            fileName: doc.fileName,
            uploadedAt: doc.uploadedAt,
            status: doc.status,
            verified: doc.verified,
            verifiedAt: doc.verifiedAt
          }))
        };
      });
    });
  } catch (error: any) {
    console.error('GET_VERIFICATION_STATUS_ERROR', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
      throw new DatabaseError(
      error.message || 'Failed to fetch verification status',
      'VERIFICATION_STATUS_ERROR'
    );
  }
};

// Additional utility functions for KYC service

export const getUserDocuments = async (userId: string) => {
  try {
    validateRequired(userId, 'userId');
    
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        const documents = await prisma.kYCDocument.findMany({
          where: { userId },
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            type: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            status: true,
            verified: true,
            uploadedAt: true,
            verifiedAt: true,
            notes: true
          }
        });
        
        return documents;
      });
    });
  } catch (error: any) {
    console.error('GET_USER_DOCUMENTS_ERROR', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    throw new DatabaseError(
      error.message || 'Failed to fetch user documents',
      'GET_DOCUMENTS_ERROR'
    );
  }
};

export const deleteUserDocument = async (userId: string, documentId: string) => {
  try {
    validateRequired(userId, 'userId');
    validateRequired(documentId, 'documentId');
    
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        // First, verify the document belongs to the user
        const document = await prisma.kYCDocument.findFirst({
          where: {
            id: documentId,
            userId
          }
        });
        
        if (!document) {
          throw new ValidationError('Document not found or does not belong to user');
        }
        
        // Don't allow deletion of approved documents
        if (document.verified) {
          throw new ValidationError('Cannot delete approved documents');
        }
        
        // Delete from S3 first
        try {
          await deleteFileFromS3(document.s3Key);
          console.log(`Deleted document file from S3: ${document.s3Key}`);
        } catch (error) {
          console.error('Failed to delete document file from S3:', error);
          // Continue with database deletion even if S3 deletion fails
        }
        
        // Delete from database
        await prisma.kYCDocument.delete({
          where: { id: documentId }
        });
        
        console.log(`Document ${documentId} deleted successfully for user ${userId}`);
        return { success: true };
      });
    });
  } catch (error: any) {
    console.error('DELETE_DOCUMENT_ERROR', {
      userId,
      documentId,
      error: error.message,
      stack: error.stack
    });
    
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    throw new DatabaseError(
      error.message || 'Failed to delete document',
      'DELETE_DOCUMENT_ERROR'
    );
  }
};

// Health check function for the KYC service
export const healthCheck = async () => {
  try {
    const dbHealthy = await checkDatabaseConnection();
    const circuitBreakerState = databaseCircuitBreaker.getState();
    
    return {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      circuitBreaker: circuitBreakerState,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('KYC_SERVICE_HEALTH_CHECK_ERROR', error);
    return {
      database: 'unhealthy',
      circuitBreaker: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
