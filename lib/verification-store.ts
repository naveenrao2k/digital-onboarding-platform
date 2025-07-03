// lib/verification-store.ts
import { create } from 'zustand';
import { getVerificationStatus } from './file-upload-service';
import { VerificationStatusEnum } from '../app/generated/prisma';

interface VerificationState {
  // Verification status
  overallStatus: VerificationStatusEnum;
  kycStatus: VerificationStatusEnum;
  selfieStatus: VerificationStatusEnum;
  
  // Progress
  progress: number;
  
  // Documents
  documents: {
    id: string;
    type: string;
    fileName: string;
    uploadedAt: string;
    status: string;
    verified?: boolean;
  }[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchVerificationStatus: (userId?: string) => Promise<void>;
  resetError: () => void;
  
  // Helper methods
  hasSubmittedDocuments: () => boolean;
}

// Create the store with set AND get parameters
export const useVerificationStore = create<VerificationState>((set, get) => ({
  // Initial state
  overallStatus: VerificationStatusEnum.PENDING,
  kycStatus: VerificationStatusEnum.PENDING,
  selfieStatus: VerificationStatusEnum.PENDING,
  progress: 0,
  documents: [],
  isLoading: false,
  error: null,
    
  // Actions
  fetchVerificationStatus: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const statusData = await getVerificationStatus(userId);
      
      // Format documents if available
      const documents = statusData.documents?.map((doc: any) => {
        // Determine the display type based on the document type and filename
        let displayType = doc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
        
        // Special handling for ID Card Front/Back
        if (displayType === 'Id Card') {
          if (doc.fileName.toLowerCase().includes('front')) {
            displayType = 'Id Card (Front)';
          } else if (doc.fileName.toLowerCase().includes('back')) {
            displayType = 'Id Card (Back)';
          }
        }
        
        return {
          id: doc.id,
          type: displayType,
          fileName: doc.fileName,
          uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(),
          status: doc.status,
          verified: doc.verified
        };
      }) || [];
      
      set({ 
        overallStatus: statusData.overallStatus,
        kycStatus: statusData.kycStatus,
        selfieStatus: statusData.selfieStatus,
        progress: statusData.progress || 0,
        documents,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch verification status',
        isLoading: false
      });
    }
  },
  
  resetError: () => set({ error: null }),
  
  // Using the get function provided by Zustand
  hasSubmittedDocuments: () => {
    const { documents } = get();
    return documents.length > 0;
  }
}));
