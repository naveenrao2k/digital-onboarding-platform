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
    
    // Check if this specific document type already exists for the user
    const existingDocument = await prisma.kYCDocument.findFirst({
      where: {
        userId,
        type: documentType,
      },
    });

    // If it exists, delete it and its chunks first
    if (existingDocument) {
      await prisma.fileChunk.deleteMany({
        where: { kycDocumentId: existingDocument.id },
      });
      
      await prisma.kYCDocument.delete({
        where: { id: existingDocument.id },
      });
    }

    // Process the file for storage
    const {
      fileContent,
      fileName,
      fileSize,
      mimeType,
      isChunked,
      chunks,
    } = await prepareFileForStorage(file);

    // Create the KYC document
    const kycDocument = await prisma.kYCDocument.create({
      data: {
        userId,
        type: documentType,
        fileContent,
        fileName,
        fileSize,
        mimeType,
        isChunked,
      },
    });

    // If the file is chunked, store the chunks
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
    }    // Upsert the verification status - create if it doesn't exist, update if it does
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

export const uploadSelfieVerification = async (userId: string, file: File) => {
  try {
    // Check if a selfie verification already exists
    const existingSelfie = await prisma.selfieVerification.findUnique({
      where: { userId },
    });

    // If it exists, delete it and its chunks first
    if (existingSelfie) {
      await prisma.fileChunk.deleteMany({
        where: { selfieVerificationId: existingSelfie.id },
      });
      
      await prisma.selfieVerification.delete({
        where: { id: existingSelfie.id },
      });
    }

    // Process the file for storage
    const {
      fileContent,
      fileName,
      fileSize,
      mimeType,
      isChunked,
      chunks,
    } = await prepareFileForStorage(file);

    // Create the selfie verification
    const selfie = await prisma.selfieVerification.create({
      data: {
        userId,
        fileContent,
        fileName,
        fileSize,
        mimeType,
        isChunked,
      },
    });

    // If the file is chunked, store the chunks
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
    }    // Upsert the verification status - create if it doesn't exist, update if it does
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
