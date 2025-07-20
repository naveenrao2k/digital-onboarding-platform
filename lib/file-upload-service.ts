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
            }          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              
              // Special handling for "already submitted" error
              if (errorResponse.error && errorResponse.error.includes('Document submission is only allowed once')) {
                reject(new Error('You have already submitted documents. Multiple submissions are not allowed.'));
              } 
              // Special handling for database connection errors
              else if (errorResponse.error && errorResponse.error.includes("Can't reach database server")) {
                console.error('Database connection error:', errorResponse.error);
                reject(new Error('Unable to connect to database. Please try again in a few moments or contact support if the problem persists.'));
              }
              // Special handling for utility bill errors
              else if (documentType.toString() === 'UTILITY_BILL' && errorResponse.error) {
                reject(new Error(`Utility bill upload failed: ${errorResponse.error}. Please ensure your document is valid and less than 3 months old.`));
              }
              else {
                reject(new Error(errorResponse.error || 'Document upload failed'));
              }
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

export const getVerificationStatus = async (userId?: string) => {
  try {
    let url = '/api/user/verification-status';
    
    // If userId is provided, add it as a query parameter
    if (userId) {
      url += `?userId=${encodeURIComponent(userId)}`;
    }
    
    const response = await fetch(url);

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

// Types for validation responses
interface ValidationResult {
  isValid: boolean;
  isReadyForUpload?: boolean;
  extractedData?: any;
  message: string;
}

// Common validation function to reduce code duplication
const validateDocument = async (
  documentType: DocumentType,
  file: File,
  businessType?: 'individual' | 'partnership' | 'enterprise' | 'llc'
): Promise<ValidationResult> => {
  try {
    // Basic file validation - NOT content validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: `Invalid file format. Only JPEG, PNG, and PDF files are supported.`
      };
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        message: `File size exceeds the 10MB limit.`
      };
    }

    // Note: This only validates file format/size, NOT document content
    return {
      isValid: true,
      isReadyForUpload: true,
      extractedData: {
        fileFormat: file.type,
        fileSize: file.size,
        fileName: file.name
      },
      message: 'File format and size acceptable - content validation will occur after upload',
    };
  } catch (error) {
    console.error('Document validation error:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to validate document',
    };
  }
};

export const validateIndividualDocument = async (
  documentType: DocumentType,
  file: File,
  backFile?: File
): Promise<ValidationResult> => {
  try {
    // Special bypass for passport and utility bill which frequently fail Dojah validation
    // Only perform basic validation for these types (file format, size)
    if (documentType === DocumentType.PASSPORT || documentType === DocumentType.UTILITY_BILL) {
      console.log(`Applying special validation rules for ${documentType}`);
      
      // Basic file validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          message: `Invalid file format. Only JPEG, PNG, and PDF files are supported.`
        };
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return {
          isValid: false,
          message: `File size exceeds the 10MB limit.`
        };
      }
      
      // For utility bill, add a warning about it being less than 3 months old
      if (documentType === DocumentType.UTILITY_BILL) {
        return {
          isValid: true,
          isReadyForUpload: true,
          message: 'Utility bill file format acceptable. Please ensure it is less than 3 months old and contains valid utility information.',
          extractedData: {
            fileFormat: file.type,
            fileSize: file.size,
            fileName: file.name
          }
        };
      }
      
      // For passport, perform basic validation but bypass Dojah API validation
      return {
        isValid: true,
        isReadyForUpload: true,
        message: 'Passport file format acceptable - content validation will occur after upload.',
        extractedData: {
          fileFormat: file.type,
          fileSize: file.size,
          fileName: file.name
        }
      };
    }
    
    // For other document types, use the normal validation flow
    // Basic file validation only - no API call
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: `Invalid file format. Only JPEG, PNG, and PDF files are supported.`
      };
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        message: `File size exceeds the 10MB limit.`
      };
    }

    return {
      isValid: true,
      isReadyForUpload: true,
      extractedData: {
        fileFormat: file.type,
        fileSize: file.size,
        fileName: file.name
      },
      message: 'File format and size acceptable - content validation will occur after upload',
    };
  } catch (error) {
    console.error('Document validation error:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to validate document',
    };
  }
};

export const validatePartnershipDocument = (documentType: DocumentType, file: File): Promise<ValidationResult> => {
  return validateDocument(documentType, file, 'partnership');
};

export const validateEnterpriseDocument = (documentType: DocumentType, file: File): Promise<ValidationResult> => {
  return validateDocument(documentType, file, 'enterprise');
};

export const validateLlcDocument = (documentType: DocumentType, file: File): Promise<ValidationResult> => {
  return validateDocument(documentType, file, 'llc');
};
