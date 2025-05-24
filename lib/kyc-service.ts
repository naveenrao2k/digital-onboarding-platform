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
    // Check if this document type already exists for the user
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
    }    // Update the verification status
    await prisma.verificationStatus.update({
      where: { userId },
      data: {
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
    }    // Update the verification status
    await prisma.verificationStatus.update({
      where: { userId },
      data: {
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
    const status = await prisma.verificationStatus.findUnique({
      where: { userId },
    });

    if (!status) {
      throw new Error('Verification status not found');
    }

    return status;
  } catch (error) {
    throw error;
  }
};
