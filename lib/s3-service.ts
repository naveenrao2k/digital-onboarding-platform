// lib/s3-service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Define your AWS region and S3 bucket name
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET_NAME || 'digital-onboarding-platform';

// Initialize S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

/**
 * Upload a file to S3
 */
export const uploadFileToS3 = async (
  file: Buffer | Blob,
  key: string,
  contentType: string
): Promise<string> => {
  let buffer: Buffer;
  
  // Convert Blob to Buffer if necessary
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });
  
  await s3Client.send(command);
  
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Generate a presigned URL for file upload (client-side uploads)
 */
export const generateUploadUrl = async (key: string, contentType: string, expiresIn = 3600): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate a presigned URL for file download
 */
export const generateDownloadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  });
  
  await s3Client.send(command);
};

/**
 * Generate a unique key for a file
 */
export const generateFileKey = (userId: string, fileType: string, fileName: string): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
  
  return `uploads/${userId}/${fileType}/${timestamp}_${sanitizedFileName}`;
};
