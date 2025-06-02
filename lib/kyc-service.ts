// lib/kyc-service.ts
import { prisma } from './prisma';
import { DocumentType, VerificationStatusEnum } from '../app/generated/prisma';
import { prepareFileForStorage } from './fileUtils';

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

    // Prepare file for storage
    const { fileContent, chunks, isChunked } = await prepareFileForStorage(file);

    // Store the KYC document
    const kycDocument = await prisma.kYCDocument.create({
      data: {
        userId,
        type: documentType,
        fileContent: !isChunked ? fileContent : null,
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name,
        isChunked,
        status: VerificationStatusEnum.IN_PROGRESS,
      },
    });

    // Store chunks if the file was chunked
    if (isChunked && chunks.length > 0) {
      const chunkCreations = chunks.map((content, index) => {
        return prisma.fileChunk.create({
          data: {
            fileId: kycDocument.id,
            chunkIndex: index,
            content,
            kycDocumentId: kycDocument.id,
          },
        });
      });

      await Promise.all(chunkCreations);
    }

    // Trigger Dojah document verification
    try {
      const documentBase64 = await fileToBase64(file);
      await triggerDojahDocumentVerification(userId, kycDocument.id, documentBase64, documentType);
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

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Trigger Dojah document verification
async function triggerDojahDocumentVerification(
  userId: string, 
  documentId: string, 
  documentBase64: string, 
  documentType: string
) {
  try {
    // Import dojahService dynamically to avoid circular dependencies
    const { default: dojahService } = await import('./dojah-service');
    await dojahService.verifyDocument(userId, documentId, documentBase64, documentType);
  } catch (error) {
    console.error('Failed to trigger Dojah verification:', error);
    throw error;
  }
}

export const uploadSelfieVerification = async (userId: string, file: File) => {
  try {
    const { fileContent, chunks, isChunked } = await prepareFileForStorage(file);

    // Store the selfie verification
    const selfie = await prisma.selfieVerification.create({
      data: {
        userId,
        fileContent: !isChunked ? fileContent : null,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        isChunked,
        status: VerificationStatusEnum.IN_PROGRESS,
      },
    });

    // Store chunks if the file was chunked
    if (isChunked && chunks.length > 0) {
      const chunkCreations = chunks.map((content, index) => {
        return prisma.fileChunk.create({
          data: {
            fileId: selfie.id,
            chunkIndex: index,
            content,
            selfieVerificationId: selfie.id,
          },
        });
      });

      await Promise.all(chunkCreations);
    }

    // Trigger Dojah selfie verification
    try {
      const selfieBase64 = await fileToBase64(file);
      
      // Get user's ID document for comparison if available
      const idDocument = await prisma.kYCDocument.findFirst({
        where: { 
          userId, 
          type: { in: ['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE'] },
          status: VerificationStatusEnum.APPROVED
        }
      });

      let idDocumentBase64: string | undefined;
      if (idDocument) {
        // Get the document content
        if (idDocument.isChunked) {
          const chunks = await prisma.fileChunk.findMany({
            where: { kycDocumentId: idDocument.id },
            orderBy: { chunkIndex: 'asc' }
          });
          const fullContent = chunks.map(chunk => chunk.content).join('');
          idDocumentBase64 = fullContent;
        } else {
          idDocumentBase64 = idDocument.fileContent || undefined;
        }
      }

      const { default: dojahService } = await import('./dojah-service');
      await dojahService.verifySelfie(userId, selfie.id, selfieBase64, idDocumentBase64);
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
