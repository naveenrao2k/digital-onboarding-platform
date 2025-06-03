// lib/fileUtils.ts
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
 * Note: This function is kept for compatibility with existing code and Dojah API
 * New code should use S3 storage via s3-service.ts
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
