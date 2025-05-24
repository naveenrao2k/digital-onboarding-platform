// lib/fileUtils.ts
import { Readable } from 'stream';

/**
 * Check if code is running on the client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Get MIME type from file extension
 */
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Convert a File object to a base64 string
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  // Client-side implementation using FileReader
  if (isClient) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // The result includes the data URL prefix (e.g., "data:image/jpeg;base64,"),
        // We extract just the base64 part
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  } 
  // Server-side implementation
  else {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }
};

/**
 * Split a base64 string into chunks of a specified size
 */
export const chunkBase64 = (base64: string, chunkSize: number = 500000): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += chunkSize) {
    chunks.push(base64.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Check if a file needs to be chunked based on its size
 */
export const shouldChunkFile = (fileSize: number): boolean => {
  // Files larger than 5MB will be chunked
  const MAX_UNCHUNKED_SIZE = 5 * 1024 * 1024; // 5MB
  return fileSize > MAX_UNCHUNKED_SIZE;
};

/**
 * Utility function to prepare file data for database storage
 */
export const prepareFileForStorage = async (file: File) => {
  const base64Content = await fileToBase64(file);
  const needsChunking = shouldChunkFile(file.size);
  
  // Determine MIME type safely
  let mimeType = file.type;
  // If mime type is not available (which can happen on the server), infer from filename
  if (!mimeType) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    mimeType = getMimeTypeFromExtension(extension || '');
  }
  
  return {
    fileContent: needsChunking ? null : base64Content,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    isChunked: needsChunking,
    chunks: needsChunking ? chunkBase64(base64Content) : [],
  };
};
