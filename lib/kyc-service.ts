// lib/kyc-service.ts
import { prisma } from './prisma';
import { DocumentType, VerificationStatusEnum } from '../app/generated/prisma';
import { uploadFileToS3, generateFileKey, deleteFileFromS3 } from './s3-service';

export type KycDocumentUpload = {
  userId: string;
  documentType: DocumentType;
  file: File;
};

export const uploadKycDocument = async ({ userId, documentType, file }: KycDocumentUpload) => {
  console.log(`Starting KYC document upload for user ${userId}, document type: ${documentType}`);
  
  try {
    // Check if the verification status is approved - in this case, don't allow any changes
    const verificationStatus = await prisma.verificationStatus.findUnique({
      where: { userId },
    });
    
    // Only if verification is APPROVED, don't allow new uploads
    // Allow uploads for PENDING and IN_PROGRESS statuses
    if (verificationStatus && 
        verificationStatus.overallStatus === VerificationStatusEnum.APPROVED && 
        verificationStatus.kycStatus === VerificationStatusEnum.APPROVED) {
      console.warn(`Upload rejected: User ${userId} already has APPROVED documents`);
      throw new Error('Your documents have already been approved. No further changes allowed.');
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

    // Validate the file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds the 10MB limit');
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed types: JPEG, PNG, PDF`);
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
    let fileUrl;
    try {
      fileUrl = await uploadFileToS3(buffer, s3Key, file.type);
      console.log(`S3 upload successful, URL: ${fileUrl}`);
    } catch (error) {
      const s3Error = error as Error;
      console.error(`S3 upload failed for user ${userId}:`, s3Error);
      throw new Error(`File upload to storage failed: ${s3Error.message || 'Unknown S3 error'}`);
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
      let documentDisplayType = documentType;
      
      // For ID Card, determine if it's front or back based on filename
      if (documentType === DocumentType.ID_CARD) {
        // Check if the filename contains "front" or "back"
        const isIdFront = file.name.toLowerCase().includes('front');
        const isIdBack = file.name.toLowerCase().includes('back');
        
        // Log what we're processing
        console.log(`Processing ID card document, filename: ${file.name}`);
        console.log(`Detected as: ${isIdFront ? 'ID Card Front' : isIdBack ? 'ID Card Back' : 'Generic ID Card'}`);
      }
      
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

    // Trigger Dojah document verification
    try {
      console.log(`Triggering Dojah verification for document ID: ${kycDocument.id}`);
      // We don't need to pass base64 since Dojah service will fetch from S3
      await triggerDojahDocumentVerification(userId, kycDocument.id);
      console.log(`Dojah verification initiated successfully for document ID: ${kycDocument.id}`);
    } catch (error) {
      const dojahError = error as Error;
      console.error(`Dojah verification failed for document ${kycDocument.id}:`, dojahError);
      
      // Update the KYC document with error status to help with troubleshooting
      await prisma.kYCDocument.update({
        where: { id: kycDocument.id },
        data: {
          notes: `Verification service error: ${dojahError.message || 'Unknown error'}`,
        },
      });
      
      // Don't fail the upload if Dojah verification fails - document will remain in IN_PROGRESS state
      console.warn(`Document upload succeeded but verification service failed: ${dojahError.message}`);
      // The document is still uploaded and in IN_PROGRESS state, admin can review manually if needed
    }

    // Upsert the verification status
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

    return kycDocument;
  } catch (error) {
    throw error;
  }
};



// Trigger Dojah document verification
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
  } catch (error) {
    console.error('Failed to trigger Dojah verification:', error);
    throw error;
  }
}

export const uploadSelfieVerification = async (userId: string, file: File) => {
  console.log(`Starting selfie verification upload for user ${userId}`);
  
  try {
    // Validate the file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size exceeds the 5MB limit');
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed types: JPEG, PNG`);
    }
    
    console.log(`Selfie file validation passed: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Check if user already has a selfie verification
    const existingSelfie = await prisma.selfieVerification.findUnique({
      where: { userId },
    });
    
    if (existingSelfie) {
      console.log(`Found existing selfie record for user ${userId}: ${existingSelfie.id}`);
    }

    // Generate S3 key for the file
    const s3Key = generateFileKey(userId, 'selfie', file.name);
    console.log(`Generated S3 key for selfie: ${s3Key}`);
    
    // Convert file to buffer for uploading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Starting S3 upload for selfie file: ${file.name}`);
    
    // Upload file to S3 with error handling
    let fileUrl;
    try {
      fileUrl = await uploadFileToS3(buffer, s3Key, file.type);
      console.log(`Selfie upload to S3 successful, URL: ${fileUrl}`);
    } catch (error) {
      const s3Error = error as Error;
      console.error(`Selfie S3 upload failed for user ${userId}:`, s3Error);
      throw new Error(`Selfie upload to storage failed: ${s3Error.message || 'Unknown S3 error'}`);
    }

    let selfie;
    
    if (existingSelfie) {
      // If a record already exists, update it instead of creating a new one
      selfie = await prisma.selfieVerification.update({
        where: { userId },
        data: {
          fileUrl,
          s3Key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: VerificationStatusEnum.IN_PROGRESS,
          verified: false,
          verifiedAt: null,
          verifiedBy: null,
          capturedAt: new Date(),
        },
      });
      
      // Delete the old file from S3 if the key is different
      if (existingSelfie.s3Key !== s3Key) {
        try {
          await deleteFileFromS3(existingSelfie.s3Key);
        } catch (error) {
          console.error('Failed to delete old selfie file:', error);
          // Continue even if deletion fails
        }
      }
    } else {
      // Store the selfie verification as a new record if it doesn't exist
      selfie = await prisma.selfieVerification.create({
        data: {
          userId,
          fileUrl,
          s3Key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: VerificationStatusEnum.IN_PROGRESS,
        },
      });
    }

    // Trigger Dojah selfie verification
    try {
      console.log(`Triggering Dojah selfie verification for user ${userId}, selfie ID: ${selfie.id}`);
      const { default: dojahService } = await import('./dojah-service');
      
      // We've already done liveness check in the route handler
      // Let Dojah service fetch the selfie from S3 for ID matching verification
      await dojahService.verifySelfie(userId, selfie.id, undefined, undefined, false);
      console.log(`Dojah selfie verification initiated successfully for selfie ID: ${selfie.id}`);
    } catch (error) {
      const dojahError = error as Error;
      console.error(`Dojah selfie verification failed for user ${userId}:`, dojahError);
      
      // Update the selfie verification with error status for troubleshooting
      await prisma.selfieVerification.update({
        where: { id: selfie.id },
        data: {
          notes: `Verification service error: ${dojahError.message || 'Unknown error'}`,
        },
      });
      
      // Don't fail the upload if Dojah verification fails - selfie will remain in IN_PROGRESS state
      console.warn(`Selfie upload succeeded but verification service failed: ${dojahError.message}`);
      // The selfie is still uploaded and in IN_PROGRESS state, admin can review manually if needed
    }

    // Upsert the verification status
    await prisma.verificationStatus.upsert({
      where: { userId },
      update: {
        selfieStatus: VerificationStatusEnum.IN_PROGRESS,
        overallStatus: VerificationStatusEnum.IN_PROGRESS,
        progress: 75,
        updatedAt: new Date(),
      },
      create: {
        userId,
        selfieStatus: VerificationStatusEnum.IN_PROGRESS,
        overallStatus: VerificationStatusEnum.IN_PROGRESS,
        progress: 75,
      },
    });

    return selfie;
  } catch (error) {
    throw error;
  }
};

export const getVerificationStatus = async (userId: string) => {
  try {
    // Try to find the existing status
    const status = await prisma.verificationStatus.findUnique({
      where: { userId },
    });

    if (!status) {
      // Create a default status if none exists
      return await prisma.verificationStatus.create({
        data: {
          userId,
          kycStatus: VerificationStatusEnum.PENDING,
          selfieStatus: VerificationStatusEnum.PENDING,
          overallStatus: VerificationStatusEnum.PENDING,
          progress: 0,
        },
      });
    }

    return status;
  } catch (error) {
    throw error;
  }
};
