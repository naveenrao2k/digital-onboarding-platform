// lib/kyc-service.ts
import { prisma } from './prisma';
import { DocumentType, VerificationStatusEnum } from '../app/generated/prisma';
import { uploadFileToS3, generateFileKey } from './s3-service';

export type KycDocumentUpload = {
  userId: string;
  documentType: DocumentType;
  file: File;
};

export const uploadKycDocument = async ({ userId, documentType, file }: KycDocumentUpload) => {
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
      throw new Error('Your documents have already been approved. No further changes allowed.');
    }

    // Generate S3 key for the file
    const s3Key = generateFileKey(userId, documentType.toString(), file.name);
    
    // Convert file to buffer for uploading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload file to S3
    const fileUrl = await uploadFileToS3(buffer, s3Key, file.type);

    // Store the KYC document with S3 URL
    const kycDocument = await prisma.kYCDocument.create({
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

    // Trigger Dojah document verification
    try {
      // We don't need to pass base64 since Dojah service will fetch from S3
      await triggerDojahDocumentVerification(userId, kycDocument.id);
    } catch (dojahError) {
      console.error('Dojah verification failed:', dojahError);
      // Don't fail the upload if Dojah fails, just log it
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
  try {
    // Check if user already has a selfie verification
    const existingSelfie = await prisma.selfieVerification.findUnique({
      where: { userId },
    });

    // Generate S3 key for the file
    const s3Key = generateFileKey(userId, 'selfie', file.name);
    
    // Convert file to buffer for uploading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload file to S3
    const fileUrl = await uploadFileToS3(buffer, s3Key, file.type);

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
      const { default: dojahService } = await import('./dojah-service');
      // Let Dojah service fetch the selfie from S3
      await dojahService.verifySelfie(userId, selfie.id);
    } catch (dojahError) {
      console.error('Dojah selfie verification failed:', dojahError);
      // Don't fail the upload if Dojah fails
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
