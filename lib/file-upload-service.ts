// lib/file-upload-service.ts
import { DocumentType } from '@/app/generated/prisma';

export const uploadKycDocument = async (
  documentType: DocumentType | string, 
  file: File, 
  onProgress?: (progress: number) => void
) => {
  try {
    // Validate that the document type is one of the valid DocumentType values
    if (typeof documentType === 'string' && !Object.values(DocumentType).includes(documentType as any)) {
      throw new Error(`Invalid document type: ${documentType}`);
    }
    
    const formData = new FormData();
    formData.append('documentType', documentType.toString());
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/user/kyc-document', true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
        
        xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Document upload failed'));
            } catch (err) {
              reject(new Error(`Upload failed with status ${this.status}`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error occurred during upload'));
        };
        
        xhr.send(formData);
      });
    } else {
      // Standard fetch implementation when progress tracking not needed
      const response = await fetch('/api/user/kyc-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Document upload failed');
      }

      return await response.json();
    }
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

export const uploadSelfieVerification = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/user/selfie-verification', true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
        
        xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Selfie verification failed'));
            } catch (err) {
              reject(new Error(`Upload failed with status ${this.status}`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error occurred during upload'));
        };
        
        xhr.send(formData);
      });
    } else {
      // Standard fetch implementation when progress tracking not needed
      const response = await fetch('/api/user/selfie-verification', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Selfie verification failed');
      }

      return await response.json();
    }
  } catch (error) {
    console.error('Selfie verification error:', error);
    throw error;
  }
};

export const getVerificationStatus = async () => {
  try {
    const response = await fetch('/api/user/verification-status');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch verification status');
    }

    return await response.json();
  } catch (error) {
    console.error('Verification status error:', error);
    throw error;
  }
};
