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
              } else {
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

export const validatePartnershipDocument = async (
  documentType: DocumentType,
  file: File
): Promise<{
  isValid: boolean;
  extractedData?: any;
  message: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', mapDocTypeForDojah(documentType));

    const response = await fetch('/api/validate-business-document', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate document');
    }

    return {
      isValid: data.isValid,
      extractedData: data.extractedData,
      message: data.message || 'Document validated successfully',
    };
  } catch (error) {
    console.error('Document validation error:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to validate document',
    };
  }
}

export const validateEnterpriseDocument = async (
  documentType: DocumentType,
  file: File
): Promise<{
  isValid: boolean;
  extractedData?: any;
  message: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', mapDocTypeForDojah(documentType));
    formData.append('business_type', 'enterprise');

    const response = await fetch('/api/validate-business-document', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate document');
    }

    return {
      isValid: data.isValid,
      extractedData: data.extractedData,
      message: data.message || 'Document validated successfully',
    };
  } catch (error) {
    console.error('Document validation error:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to validate document',
    };
  }
}

export const validateLlcDocument = async (
  documentType: DocumentType,
  file: File
): Promise<{
  isValid: boolean;
  extractedData?: any;
  message: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', mapDocTypeForDojah(documentType));
    formData.append('business_type', 'llc');

    const response = await fetch('/api/validate-business-document', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate document');
    }

    return {
      isValid: data.isValid,
      extractedData: data.extractedData,
      message: data.message || 'Document validated successfully',
    };
  } catch (error) {
    console.error('Document validation error:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to validate document',
    };
  }
}

// Helper to map our document types to Dojah API document types
function mapDocTypeForDojah(documentType: DocumentType): string {
  const mapping: Record<DocumentType, string> = {
    [DocumentType.ID_CARD]: 'id_card',
    [DocumentType.PASSPORT]: 'passport',
    [DocumentType.UTILITY_BILL]: 'utility_bill',
    [DocumentType.CERTIFICATE_OF_REGISTRATION]: 'business_registration',
    [DocumentType.FORM_OF_APPLICATION]: 'business_reg_form',
    [DocumentType.VALID_ID_OF_PARTNERS]: 'id_card',
    [DocumentType.PROOF_OF_ADDRESS]: 'proof_of_address',
    [DocumentType.CERTIFICATE_OF_INCORPORATION]: 'certificate_of_incorporation',
    [DocumentType.MEMORANDUM_ARTICLES]: 'memorandum_articles',
    [DocumentType.BOARD_RESOLUTION]: 'board_resolution',
    [DocumentType.DIRECTORS_ID]: 'id_card',
    [DocumentType.PASSPORT_PHOTOS]: 'passport_photo',
    [DocumentType.UTILITY_RECEIPT]: 'utility_bill',
    // Add any other document types as needed
  };
  
  return mapping[documentType] || 'generic_document';
}
