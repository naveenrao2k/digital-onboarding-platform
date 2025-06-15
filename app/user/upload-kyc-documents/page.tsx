'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Upload, CheckCircle, User, Building, Building2, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { 
  uploadKycDocument,
  validateIndividualDocument,
  validatePartnershipDocument,
  validateEnterpriseDocument,
  validateLlcDocument
} from '@/lib/file-upload-service';
import { DocumentType, VerificationStatusEnum } from '@/app/generated/prisma';
import { useVerificationStore } from '@/lib/verification-store';
import StepCompletionMessage from '@/components/StepCompletionMessage';


const TextInput = ({
    label,
    name,
    value,
    placeholder,
    onChange
  }: {
    label: string,
    name: string,
    value: string,
    placeholder: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
  
// Helper function to get required documents for each account type
const getRequiredDocumentsForAccountType = (type: string): string[] => {
  switch (type) {
    case 'individual':
      return ['idCardFront', 'idCardBack']; // Now require both front and back of ID card
    case 'partnership':
      return ['certificateOfRegistration', 'validIdOfPartners'];
    case 'enterprise':
      return ['certificateOfRegistration', 'businessOwnerID'];
    case 'llc':
      return ['certificateOfIncorporation', 'directorsID'];
    default:
      return [];
  }
};

const formatDocumentName = (docType: string): string => {
  return docType.replace(/([A-Z])/g, ' $1').trim();
};

// Helper function to convert form docType to valid DocumentType enum
const docTypeToEnumMapping = (docType: string): DocumentType => {
  const mapping: {[key: string]: DocumentType} = {
    // Individual documents
    idCard: DocumentType.ID_CARD,    idCardFront: DocumentType.ID_CARD,
    idCardBack: DocumentType.ID_CARD,
    passport: DocumentType.PASSPORT,
    utilityBill: DocumentType.UTILITY_BILL,
    
    // Partnership documents
    certificateOfRegistration: DocumentType.CERTIFICATE_OF_REGISTRATION,
    formOfApplication: DocumentType.FORM_OF_APPLICATION,
    validIdOfPartners: DocumentType.VALID_ID_OF_PARTNERS,
    proofOfAddress: DocumentType.PROOF_OF_ADDRESS,
    
    // Enterprise documents
    passportPhotos: DocumentType.PASSPORT_PHOTOS,
    utilityReceipt: DocumentType.UTILITY_RECEIPT,
    businessOwnerID: DocumentType.ID_CARD,
    
    // LLC documents
    certificateOfIncorporation: DocumentType.CERTIFICATE_OF_INCORPORATION,
    memorandumArticles: DocumentType.MEMORANDUM_ARTICLES,
    boardResolution: DocumentType.BOARD_RESOLUTION,
    directorsID: DocumentType.DIRECTORS_ID
  };
  
  return mapping[docType] || DocumentType.ID_CARD; // Default to ID_CARD if not found
};

const UploadKYCDocumentsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [accountType, setAccountType] = useState('individual');
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  
  const { 
    documents,
    kycStatus,
    fetchVerificationStatus,
    hasSubmittedDocuments
  } = useVerificationStore();
  
  // Check if documents were already submitted
  const alreadySubmitted = hasSubmittedDocuments();
  
  // Check if user has already completed document upload
  const isDocumentUploadComplete = kycStatus === VerificationStatusEnum.APPROVED || 
    (documents && documents.length > 0 && documents.every(doc => doc.verified));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/access');
    } else if (user && !hasCheckedStatus) {
      setHasCheckedStatus(true);
      fetchVerificationStatus(user.id);
    }
  }, [user, loading, router, hasCheckedStatus, fetchVerificationStatus]);

  // If documents are already approved, show completion message
  if (isDocumentUploadComplete) {
    return (
      <StepCompletionMessage
        title="Documents Already Uploaded"
        message="You have already completed the document upload step. Your documents have been verified."
        backUrl="/user/verification-status"
        backButtonText="View Verification Status"
      />
    );
  }

  // We don't need the second effect that redirects automatically
  // This was causing the issue by preventing multiple document uploads
  
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});

  // Individual account documents
  const [individualDocuments, setIndividualDocuments] = useState({
    idCardFront: null as File | null,
    idCardBack: null as File | null,
    passport: null as File | null,
    utilityBill: null as File | null
  });

  // Partnership account documents
  const [partnershipDocuments, setPartnershipDocuments] = useState({
    certificateOfRegistration: null as File | null,
    formOfApplication: null as File | null,
    validIdOfPartners: null as File | null,
    proofOfAddress: null as File | null
  });

  // Enterprise account documents
  const [enterpriseDocuments, setEnterpriseDocuments] = useState({
    certificateOfRegistration: null as File | null,
    formOfApplication: null as File | null,
    passportPhotos: null as File | null,
    utilityReceipt: null as File | null,
    businessOwnerID: null as File | null
  });

  // LLC account documents
  const [llcDocuments, setLlcDocuments] = useState({
    certificateOfIncorporation: null as File | null,
    memorandumArticles: null as File | null,
    boardResolution: null as File | null,
    directorsID: null as File | null,
    proofOfAddress: null as File | null
  });

  // References for all business types
  const [references, setReferences] = useState({
    ref1Name: '',
    ref1Address: '',
    ref1Phone: '',
    ref2Name: '',
    ref2Address: '',
    ref2Phone: ''
  });

  // Business address for enterprise and LLC
  const [businessAddress, setBusinessAddress] = useState('');

  // Tax and registration numbers for LLC
  const [taxInfo, setTaxInfo] = useState({
    taxNumber: '',
    scumlNumber: ''
  });

  // File names for display
  const [fileNames, setFileNames] = useState({
    // Individual
    idCardFront: '',
    idCardBack: '',
    passport: '',
    utilityBill: '',

    // Partnership
    certificateOfRegistration: '',
    formOfApplication: '',
    validIdOfPartners: '',
    proofOfAddress: '',

    // Enterprise
    passportPhotos: '',
    utilityReceipt: '',
    businessOwnerID: '',

    // LLC
    certificateOfIncorporation: '',
    memorandumArticles: '',
    boardResolution: '',
    directorsID: ''
  });

  // File input refs
  const fileInputRefs = {
    // Individual
    idCardFront: useRef<HTMLInputElement>(null),
    idCardBack: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    utilityBill: useRef<HTMLInputElement>(null),

    // Partnership
    certificateOfRegistration: useRef<HTMLInputElement>(null),
    formOfApplication: useRef<HTMLInputElement>(null),
    validIdOfPartners: useRef<HTMLInputElement>(null),
    proofOfAddress: useRef<HTMLInputElement>(null),

    // Enterprise
    passportPhotos: useRef<HTMLInputElement>(null),
    utilityReceipt: useRef<HTMLInputElement>(null),
    businessOwnerID: useRef<HTMLInputElement>(null),

    // LLC
    certificateOfIncorporation: useRef<HTMLInputElement>(null),
    memorandumArticles: useRef<HTMLInputElement>(null),
    boardResolution: useRef<HTMLInputElement>(null),
    directorsID: useRef<HTMLInputElement>(null)
  };

  const accountTypes = [
    { id: 'individual', name: 'Individual Account', icon: User },
    { id: 'partnership', name: 'Partnership Account', icon: Building },
    { id: 'enterprise', name: 'Enterprise Account', icon: Building2 },
    { id: 'llc', name: 'Limited Liability Account', icon: FileText }
  ];
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, accountTypeKey: 'individual' | 'partnership' | 'enterprise' | 'llc') => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    // Map docType to appropriate DocumentType enum
    const documentEnum = docTypeToEnumMapping(docType);
    const docTypeFormatted = documentEnum.toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      // Check if this specific document exists in the documents array
    // For ID cards, we handle front and back separately
    let hasThisDocType = false;
    
    console.log(`Checking for existing document: ${docType}, enum: ${documentEnum}`);
    
    if (docType === 'idCardFront') {
      hasThisDocType = documents?.some(doc => doc.type === 'ID_CARD_FRONT' || doc.type === 'Id Card Front');
      console.log(`ID Card Front exists: ${hasThisDocType}`);
    } else if (docType === 'idCardBack') {
      hasThisDocType = documents?.some(doc => doc.type === 'ID_CARD_BACK' || doc.type === 'Id Card Back');
      console.log(`ID Card Back exists: ${hasThisDocType}`);
    } else {
      hasThisDocType = documents?.some(doc => doc.type === docTypeFormatted);
      console.log(`Other document exists: ${hasThisDocType}, looking for: ${docTypeFormatted}`);
    }
    
    if (hasThisDocType) {
      setError(`You've already uploaded a ${docType.replace(/([A-Z])/g, ' $1').trim()}. Please use the 'Change File' option to replace it.`);
      return;
    }    // Update file status to uploading
    setUploadStatus(prev => ({ ...prev, [docType]: 'uploading' }));
    setUploadProgress(prev => ({ ...prev, [docType]: 5 }));
      // Set up a progress simulation for the validation phase
    // Start at minimum 5% so user sees immediate feedback
    setUploadProgress(prev => ({ ...prev, [docType]: 5 }));
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[docType] || 0;
        // Don't let the simulated progress go beyond 60% - real progress updates will take over
        return { ...prev, [docType]: Math.min(currentProgress + 3, 60) };
      });
    }, 300);
      try {
      // Validate document before actually uploading it
      let validationResult: { isValid: boolean; extractedData?: any; message: string; };
      
      if (accountTypeKey === 'individual') {
        // For individual documents, validate with appropriate method
        if (docType === 'idCardFront' || docType === 'idCardBack') {
          validationResult = await validateIndividualDocument(documentEnum, file);
          setUploadProgress(prev => ({ ...prev, [docType]: 70 }));
          
          if (!validationResult.isValid) {
            // Clear the progress simulation interval for ID card validation
            clearInterval(progressInterval);
            
            setUploadStatus(prev => ({ ...prev, [docType]: 'error' }));
            setError(`Document validation failed: ${validationResult.message}`);
            return;
          }
          
          if (validationResult.extractedData) {
            setExtractedDocumentData(prev => ({
              ...prev,
              [docType]: validationResult.extractedData
            }));
          }
            // Update the documents state based on which side was uploaded
          if (docType === 'idCardFront') {
            console.log('Setting ID Card Front document:', file.name);
            setIndividualDocuments(prev => ({ ...prev, idCardFront: file }));
            setFileNames(prev => ({ ...prev, idCardFront: file.name }));
          } else if (docType === 'idCardBack') {
            console.log('Setting ID Card Back document:', file.name);
            setIndividualDocuments(prev => ({ ...prev, idCardBack: file }));
            setFileNames(prev => ({ ...prev, idCardBack: file.name }));
          }
          
          // Clear the progress simulation interval
          clearInterval(progressInterval);
          
          // Set upload as completed
          setUploadProgress(prev => ({ ...prev, [docType]: 100 }));
          setUploadStatus(prev => ({ ...prev, [docType]: 'success' }));
            // For ID cards, we'll let the useEffect handle verification
          console.log(`ID card ${docType} uploaded successfully`);
          
          return;
        } else {
          // Handle other individual documents (passport, utility bill)
          validationResult = await validateIndividualDocument(documentEnum, file);
        }
      } 
      else if (accountTypeKey === 'partnership') {
        // Partnership validation logic
        validationResult = await validatePartnershipDocument(documentEnum, file);
      }
      else if (accountTypeKey === 'enterprise') {
        // Enterprise validation logic
        validationResult = await validateEnterpriseDocument(documentEnum, file);
      }
      else if (accountTypeKey === 'llc') {
        // Validate LLC documents
        validationResult = await validateLlcDocument(documentEnum, file);
        setUploadProgress(prev => ({ ...prev, [docType]: 70 }));
        
        // If validation fails, show error and return
        if (!validationResult.isValid) {
          setUploadStatus(prev => ({ ...prev, [docType]: 'error' }));
          setError(`Document validation failed: ${validationResult.message}`);
          return;
        }
        
        // Process extracted data specific to LLC documents
        if (validationResult.extractedData) {
          setExtractedDocumentData(prev => ({
            ...prev,
            [docType]: validationResult.extractedData
          }));
          
          // Handle specific LLC document types
          if (docType === 'certificateOfIncorporation') {
            // Auto-fill company details if available
            if (validationResult.extractedData.businessName) {
              setBusinessName(validationResult.extractedData.businessName);
            }
            
            // Auto-fill tax information if available
            if (validationResult.extractedData.taxNumber) {
              setTaxInfo(prev => ({
                ...prev,
                taxNumber: validationResult.extractedData.taxNumber
              }));
            }
            
            if (validationResult.extractedData.businessAddress) {
              setBusinessAddress(validationResult.extractedData.businessAddress);
            }
          }
          
          if (docType === 'boardResolution') {
            // Could store authorized signatories info if needed
            // setAuthorizedSignatories(validationResult.extractedData.authorizedSignatories);
          }
          
          if (docType === 'memorandumArticles') {
            // Could extract company objectives, share capital, etc.
            // setCompanyObjectives(validationResult.extractedData.companyObjectives);
          }
        }
      }      // Update the appropriate document state based on account type
      switch (accountTypeKey) {
        case 'individual':
          // For individual documents that aren't ID card front/back (which are handled above)
          if (docType === 'passport') {
            setIndividualDocuments(prev => ({ ...prev, passport: file }));
            setFileNames(prev => ({ ...prev, passport: file.name }));
          } else if (docType === 'utilityBill') {
            setIndividualDocuments(prev => ({ ...prev, utilityBill: file }));
            setFileNames(prev => ({ ...prev, utilityBill: file.name }));
          }
          break;
        case 'partnership':
          (partnershipDocuments as any)[docType] = file;
          setFileNames(prev => ({ ...prev, [docType]: file.name }));
          break;
        case 'enterprise':
          (enterpriseDocuments as any)[docType] = file;
          setFileNames(prev => ({ ...prev, [docType]: file.name }));
          break;
        case 'llc':
          (llcDocuments as any)[docType] = file;
          setFileNames(prev => ({ ...prev, [docType]: file.name }));
          break;
      }      // Clear the progress simulation interval
      clearInterval(progressInterval);

      // Update progress and status
      setUploadProgress(prev => ({ ...prev, [docType]: 100 }));
      setUploadStatus(prev => ({ ...prev, [docType]: 'success' }));
      
    } catch (error) {
      // Clear the progress simulation interval
      clearInterval(progressInterval);
      
      console.error(`Error handling file upload for ${docType}:`, error);
      setUploadStatus(prev => ({ ...prev, [docType]: 'error' }));
      setError(error instanceof Error ? error.message : 'An error occurred during file processing');
    }
  }
};

// Add a new state to store extracted document data
const [extractedDocumentData, setExtractedDocumentData] = useState<{[key: string]: any}>({});
const [businessName, setBusinessName] = useState('');

// Function to trigger combined ID card verification when both front and back are uploaded
const triggerCombinedIdCardVerification = async (): Promise<void> => {
  try {
    console.log("Triggering combined ID card verification");
    setError('');
    
    // Double check that both documents are still available
    if (!individualDocuments.idCardFront || !individualDocuments.idCardBack) {
      console.error('Missing front or back ID card documents', {
        front: !!individualDocuments.idCardFront,
        back: !!individualDocuments.idCardBack
      });
      setError('Both front and back ID card documents must be uploaded before verification');
      return;
    }
    
    console.log('Front document ready:', individualDocuments.idCardFront?.name);
    console.log('Back document ready:', individualDocuments.idCardBack?.name);
    
    try {
      // Perform the combined verification
      const result = await validateIndividualDocument(
        DocumentType.ID_CARD,
        individualDocuments.idCardFront,
        individualDocuments.idCardBack
      );
      
      if (!result.isValid) {
        setError(result.message || 'ID card verification failed');
        return;
      }
      
      // If validation succeeds, proceed with the upload
      await Promise.all([
        uploadKycDocument(
          DocumentType.ID_CARD,
          individualDocuments.idCardFront,
          (progress) => setUploadProgress(prev => ({ ...prev, idCardFront: progress }))
        ),
        uploadKycDocument(
          DocumentType.ID_CARD,
          individualDocuments.idCardBack,
          (progress) => setUploadProgress(prev => ({ ...prev, idCardBack: progress }))
        )
      ]);
      
      // Update status after successful upload
      setUploadStatus(prev => ({
        ...prev,
        idCardFront: 'success',
        idCardBack: 'success'
      }));
      
    } catch (error) {
      console.error('Error during combined verification:', error);
      setError('Failed to verify ID card. Please try again.');
      setUploadStatus(prev => ({
        ...prev,
        idCardFront: 'error',
        idCardBack: 'error'
      }));
    }
    
  } catch (error) {
    console.error('Error in triggerCombinedIdCardVerification:', error);
    setError('An unexpected error occurred. Please try again.');
  }
};

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReferences(prev => ({ ...prev, [name]: value }));
  };

  const handleTaxInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTaxInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate business-specific information
    if (accountType === 'partnership' || accountType === 'enterprise' || accountType === 'llc') {
      // Validate corporate references for business accounts
      const missingReference = [
        references.ref1Name,
        references.ref1Address,
        references.ref1Phone,
        references.ref2Name,
        references.ref2Address,
        references.ref2Phone
      ].some((val) => !val.trim());
      
      if (missingReference) {
        setError('Please fill in all corporate reference fields.');
        setIsSubmitting(false);
        return;
      }
      
      // Validate business address for enterprise and LLC
      if ((accountType === 'enterprise' || accountType === 'llc') && !businessAddress.trim()) {
        setError('Business address is required.');
        setIsSubmitting(false);
        return;
      }
      
      // Validate tax information for LLC
      if (accountType === 'llc' && !taxInfo.taxNumber.trim()) {
        setError('Tax Identification Number is required for Limited Liability Companies.');
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      // Upload documents based on account type
      let uploadPromises: Promise<any>[] = [];
      let documentsToSave: any = {
        accountType,
        documents: {},
        extractedData: extractedDocumentData  // Include extracted data from document validation
      };
      
      // Check if user already has documents submitted
      if (hasSubmittedDocuments()) {
        setError('You have already submitted documents. Please check your verification status.');
        setIsSubmitting(false);
        return;
      }      switch (accountType) {
        case 'individual':
          // ID Card Front
          if (individualDocuments.idCardFront) {
            setUploadStatus(prev => ({ ...prev, idCardFront: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.ID_CARD, 
                individualDocuments.idCardFront,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, idCardFront: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, idCardFront: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, idCardFront: 'error' })))
            );
            documentsToSave.documents.idCardFront = individualDocuments.idCardFront.name;
          }
          
          // ID Card Back
          if (individualDocuments.idCardBack) {
            setUploadStatus(prev => ({ ...prev, idCardBack: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.ID_CARD, 
                individualDocuments.idCardBack,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, idCardBack: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, idCardBack: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, idCardBack: 'error' })))
            );
            documentsToSave.documents.idCardBack = individualDocuments.idCardBack.name;
          }
          
          // Passport
          if (individualDocuments.passport) {
            setUploadStatus(prev => ({ ...prev, passport: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.PASSPORT, 
                individualDocuments.passport,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, passport: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, passport: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, passport: 'error' })))
            );
            documentsToSave.documents.passport = individualDocuments.passport.name;
          }
          
          // Utility Bill
          if (individualDocuments.utilityBill) {
            setUploadStatus(prev => ({ ...prev, utilityBill: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.UTILITY_BILL, 
                individualDocuments.utilityBill,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, utilityBill: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, utilityBill: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, utilityBill: 'error' })))
            );
            documentsToSave.documents.utilityBill = individualDocuments.utilityBill.name;
          }
          
          // If both front and back ID cards are uploaded, trigger combined verification
          if (individualDocuments.idCardFront && individualDocuments.idCardBack) {
            documentsToSave.hasBothIdCardSides = true;
          }
          break;
          
        case 'partnership':
          // Certificate of Registration
          if (partnershipDocuments.certificateOfRegistration) {
            setUploadStatus(prev => ({ ...prev, certificateOfRegistration: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.CERTIFICATE_OF_REGISTRATION, 
                partnershipDocuments.certificateOfRegistration,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, certificateOfRegistration: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, certificateOfRegistration: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, certificateOfRegistration: 'error' })))
            );
            documentsToSave.documents.certificateOfRegistration = partnershipDocuments.certificateOfRegistration.name;
          }
          
          // Form of Application
          if (partnershipDocuments.formOfApplication) {
            setUploadStatus(prev => ({ ...prev, formOfApplication: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.FORM_OF_APPLICATION, 
                partnershipDocuments.formOfApplication,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, formOfApplication: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, formOfApplication: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, formOfApplication: 'error' })))
            );
            documentsToSave.documents.formOfApplication = partnershipDocuments.formOfApplication.name;
          }
          
          // Valid ID of Partners
          if (partnershipDocuments.validIdOfPartners) {
            setUploadStatus(prev => ({ ...prev, validIdOfPartners: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.VALID_ID_OF_PARTNERS, 
                partnershipDocuments.validIdOfPartners,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, validIdOfPartners: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, validIdOfPartners: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, validIdOfPartners: 'error' })))
            );
            documentsToSave.documents.validIdOfPartners = partnershipDocuments.validIdOfPartners.name;
          }
          
          // Proof of Address
          if (partnershipDocuments.proofOfAddress) {
            setUploadStatus(prev => ({ ...prev, proofOfAddress: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.PROOF_OF_ADDRESS, 
                partnershipDocuments.proofOfAddress,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, proofOfAddress: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, proofOfAddress: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, proofOfAddress: 'error' })))
            );
            documentsToSave.documents.proofOfAddress = partnershipDocuments.proofOfAddress.name;
          }
          
          documentsToSave.references = references;
          documentsToSave.businessName = businessName;
          break;
          
        case 'enterprise':
          // Add upload logic for all enterprise documents
          if (enterpriseDocuments.certificateOfRegistration) {
            setUploadStatus(prev => ({ ...prev, certificateOfRegistration: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.CERTIFICATE_OF_REGISTRATION, 
                enterpriseDocuments.certificateOfRegistration,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, certificateOfRegistration: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, certificateOfRegistration: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, certificateOfRegistration: 'error' })))
            );
            documentsToSave.documents.certificateOfRegistration = enterpriseDocuments.certificateOfRegistration.name;
          }
          
          // Add other enterprise documents
          // ...existing code...
          
          documentsToSave.businessAddress = businessAddress;
          documentsToSave.businessName = businessName;
          documentsToSave.references = references;
          break;
          
        case 'llc':
          // Add upload logic for all LLC documents
          if (llcDocuments.certificateOfIncorporation) {
            setUploadStatus(prev => ({ ...prev, certificateOfIncorporation: 'uploading' }));
            uploadPromises.push(
              uploadKycDocument(
                DocumentType.CERTIFICATE_OF_INCORPORATION, 
                llcDocuments.certificateOfIncorporation,
                (progress) => {
                  setUploadProgress(prev => ({ ...prev, certificateOfIncorporation: progress }));
                }
              ).then(() => setUploadStatus(prev => ({ ...prev, certificateOfIncorporation: 'success' })))
               .catch(() => setUploadStatus(prev => ({ ...prev, certificateOfIncorporation: 'error' })))
            );
            documentsToSave.documents.certificateOfIncorporation = llcDocuments.certificateOfIncorporation.name;
          }
          
          // Add other LLC documents
          // ...existing code...
          
          documentsToSave.taxInfo = taxInfo;
          documentsToSave.businessAddress = businessAddress;
          documentsToSave.businessName = businessName;
          documentsToSave.references = references;
          break;
      }      // Check if there are any documents to upload and validate required documents
      if (uploadPromises.length === 0) {
        setError('Please upload at least one document.');
        setIsSubmitting(false);
        return;
      }
      
      // Validate required documents based on account type
      const requiredDocs = getRequiredDocumentsForAccountType(accountType);
      let missingRequired = false;
      
      if (accountType === 'individual') {
        // For individual accounts, require both front and back of ID card
        if (!individualDocuments.idCardFront || !individualDocuments.idCardBack) {
          setError('Please upload both the front and back sides of your ID card.');
          missingRequired = true;
        }
      } else if (accountType === 'partnership') {
        // Check for required partnership documents
        const hasAllRequired = requiredDocs.every(doc => {
          const docKey = doc as keyof typeof partnershipDocuments;
          return !!partnershipDocuments[docKey];
        });
        
        if (!hasAllRequired) {
          setError('Please upload all required documents for partnership account.');
          missingRequired = true;
        }
      } else if (accountType === 'enterprise') {
        // Check for required enterprise documents
        const hasAllRequired = requiredDocs.every(doc => {
          const docKey = doc as keyof typeof enterpriseDocuments;
          return !!enterpriseDocuments[docKey];
        });
        
        if (!hasAllRequired) {
          setError('Please upload all required documents for enterprise account.');
          missingRequired = true;
        }
      } else if (accountType === 'llc') {
        // Check for required LLC documents
        const hasAllRequired = requiredDocs.every(doc => {
          const docKey = doc as keyof typeof llcDocuments;
          return !!llcDocuments[docKey];
        });
        
        if (!hasAllRequired) {
          setError('Please upload all required documents for LLC account.');
          missingRequired = true;
        }
      }
      
      if (missingRequired) {
        setIsSubmitting(false);
        return;
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Save metadata to localStorage
      localStorage.setItem('kycDocuments', JSON.stringify(documentsToSave));
        // For individual accounts, trigger combined verification if both ID card sides are uploaded
      if (accountType === 'individual' && documentsToSave.hasBothIdCardSides) {
        try {
          await triggerCombinedIdCardVerification();
          console.log('Combined verification triggered after submission');
        } catch (error) {
          console.warn('Failed to trigger combined verification after submission:', error);
          // Continue with submission even if combined verification fails
        }
      }
      
      // Set submission as complete
      setIsSubmitted(true);
    } catch (err) {
      console.error('Document upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload documents. Please try again.';
      
      // Set the error in a more user-friendly format
      if (errorMessage.includes('You have already uploaded')) {
        setError('You can only upload one document of each type. Please use the Change File option to replace an existing document.');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('size')) {
        setError('One or more files exceed the maximum allowed size (5MB).');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
    // File upload component
  const FileUploadBox = ({
    docType,
    label,
    accountTypeKey,
    fileRef
  }: {
    docType: string,
    label: string,
    accountTypeKey: 'individual' | 'partnership' | 'enterprise' | 'llc',
    fileRef: React.RefObject<HTMLInputElement>
  }) => {
    // Determine if file is uploaded based on account type and document type
    let isFileUploaded = false;
    let fileName = '';
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    switch (accountTypeKey) {
      case 'individual':
        isFileUploaded = !!individualDocuments[docType as keyof typeof individualDocuments];
        break;
      case 'partnership':
        isFileUploaded = !!partnershipDocuments[docType as keyof typeof partnershipDocuments];
        break;
      case 'enterprise':
        isFileUploaded = !!enterpriseDocuments[docType as keyof typeof enterpriseDocuments];
        break;
      case 'llc':
        isFileUploaded = !!llcDocuments[docType as keyof typeof llcDocuments];
        break;
    }
    
    // Check if this document is already in the server documents list
    const documentEnum = docTypeToEnumMapping(docType);
    const docTypeFormatted = documentEnum.toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    const existingServerDoc = documents?.find(doc => doc.type === docTypeFormatted);
    
    // If document is already uploaded to server, use its filename
    if (existingServerDoc) {
      fileName = existingServerDoc.fileName;
      isFileUploaded = true;
    } else {
      fileName = fileNames[docType as keyof typeof fileNames];
    }
    
    const progress = uploadProgress[docType] || 0;
    const status = uploadStatus[docType] || (existingServerDoc ? 'success' : 'idle');
    
    // Helper function to get the file by type and account type
    const getFileByType = (accountType: string, docType: string): File | null => {
      switch (accountType) {
        case 'individual':
          return individualDocuments[docType as keyof typeof individualDocuments];
        case 'partnership':
          return partnershipDocuments[docType as keyof typeof partnershipDocuments];
        case 'enterprise':
          return enterpriseDocuments[docType as keyof typeof enterpriseDocuments];
        case 'llc':
          return llcDocuments[docType as keyof typeof llcDocuments];
        default:
          return null;
      }
    };
    
    // Create preview for image files
    const handlePreview = (file: File) => {
      // Only create previews for images, not PDFs
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just show an icon
        setPreviewUrl(null);
      }
    };
    
    // Update the component to show preview when a file is selected
    useEffect(() => {
      const file = getFileByType(accountTypeKey, docType);
      if (file) {
        handlePreview(file);
      }
    }, [accountTypeKey, docType]);

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 ${
            status === 'success' ? 'border-green-200 bg-green-50' : 
            status === 'error' ? 'border-red-200 bg-red-50' : 
            isFileUploaded ? 'border-blue-200 bg-blue-50' : 
            'border-slate-200 hover:border-blue-400'
          }`}
        >
          {status === 'uploading' ? (            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-slate-600 text-center">{fileName}</p>
              <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ 
                  width: `${progress}%`,
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {progress < 20 ? 'Processing...' : 
                 progress < 90 ? `Uploading... ${progress}%` :
                 'Finishing up...'}
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              {previewUrl && (
                <div className="mb-2 max-w-xs">
                  <img 
                    src={previewUrl} 
                    alt="Document preview" 
                    className="max-h-32 max-w-full object-contain rounded border border-gray-200" 
                  />
                </div>
              )}
              <p className="text-sm text-slate-600 text-center">{fileName}</p>
              <p className="text-sm text-green-600 mt-1">File uploaded successfully</p>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-slate-600 text-center">{fileName}</p>
              <p className="text-sm text-red-600 mt-1">Upload failed</p>
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-red-50 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-100"
                onClick={() => fileRef.current?.click()}
              >
                Try Again
              </button>
            </div>
          ) : isFileUploaded ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              {previewUrl && (
                <div className="mb-2 max-w-xs">
                  <img 
                    src={previewUrl} 
                    alt="Document preview" 
                    className="max-h-32 max-w-full object-contain rounded border border-gray-200" 
                  />
                </div>
              )}
              <p className="text-sm text-slate-600 text-center">{fileName}</p>
              <p className="text-sm text-blue-600 mt-1">File selected and ready</p>
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-100"
                onClick={() => fileRef.current?.click()}
              >
                Change File
              </button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center"
            >
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Upload className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600 text-center">Click to upload or drag and drop</p>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => fileRef.current?.click()}
              >
                Select File
              </button>
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => {
                  handleFileChange(e, docType, accountTypeKey);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Text input component for references
  

  // Success screen component
  const SuccessScreen = () => {
    return (
      <div className="max-h-screen flex items-center justify-center pt-20">
        <div className="max-w-md w-full mx-auto rounded-xl shadow-md overflow-hidden border">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Documents Submitted</h2>
            <p className="text-gray-600 mb-8">Your documents have been uploaded successfully.</p>

            <div className="bg-blue-600 rounded-lg p-12 mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-blue-400 bg-opacity-30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-white text-xl font-medium">Thank you!</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              We've recieved your documents and will begin processing them. Next, we'll need to verify your identity with a quick selfie verification.
            </p>

            <button
              onClick={() => router.push('/user/selfie-verification')}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Proceed to Selfie Verification
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Already submitted screen component
  const AlreadySubmittedScreen = () => {
    return (
      <div className="max-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto rounded-xl shadow-md overflow-hidden border">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Documents Already Submitted</h2>
            <p className="text-gray-600 mb-8">You have already submitted your KYC documents.</p>

            <div className="bg-amber-600 rounded-lg p-12 mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-amber-400 bg-opacity-30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-white text-xl font-medium">Multiple Submissions Not Allowed</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Our team is currently reviewing your previously submitted documents. You can check your verification status in your dashboard.
            </p>

            <button
              onClick={() => router.push('/user/dashboard')}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If documents are submitted, show success screen
  if (isSubmitted) {
    return <SuccessScreen />;
  }

  // If user has already submitted documents before, show the already submitted screen
  if (alreadySubmitted) {
    return <AlreadySubmittedScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 rounded">
      <div className='rounded-xl shadow-md p-6 md:p-8'>
        <div className="rounded-t-xl bg-blue-600 -m-8 mb-6 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Upload KYC Documents</h2>
          <p>Please upload the required documents for identity verification</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="text-amber-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Important</p>
              <p className="text-amber-700">All documents must be clear, unaltered, and valid. Supported formats: JPG, PNG, PDF (max 5MB each).</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Type
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-left flex items-center justify-between"
                onClick={() => setShowAccountOptions(!showAccountOptions)}
              >
                <div className="flex items-center">
                  {(() => {
                    const selectedType = accountTypes.find(type => type.id === accountType);
                    if (selectedType?.icon) {
                      const Icon = selectedType.icon;
                      return <Icon className="h-5 w-5 text-slate-500 mr-2" />;
                    }
                    return null;
                  })()}
                  <span>{accountTypes.find(type => type.id === accountType)?.name}</span>
                </div>
                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showAccountOptions && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg">
                  {accountTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      className="w-full px-4 py-3 text-left flex items-center hover:bg-slate-50"
                      onClick={() => {
                        setAccountType(type.id);
                        setShowAccountOptions(false);
                      }}
                    >
                      <type.icon className="h-5 w-5 text-slate-500 mr-2" />
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Individual Account Requirements */}
          {accountType === 'individual' && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-slate-500 mr-2" />
                <h3 className="text-lg font-medium">Individual Requirements</h3>
              </div>              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadBox
                  docType="idCardFront"
                  label="ID Card (Front Side)"
                  accountTypeKey="individual"
                  fileRef={fileInputRefs.idCardFront}
                />

                <FileUploadBox
                  docType="idCardBack"
                  label="ID Card (Back Side)"
                  accountTypeKey="individual"
                  fileRef={fileInputRefs.idCardBack}
                />
                
                <FileUploadBox
                  docType="passport"
                  label="Passport"
                  accountTypeKey="individual"
                  fileRef={fileInputRefs.passport}
                />

                <div className="md:col-span-2">
                  <FileUploadBox
                    docType="utilityBill"
                    label="Utility Bill (not older than 3 months)"
                    accountTypeKey="individual"
                    fileRef={fileInputRefs.utilityBill}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Partnership Account Requirements */}
          {accountType === 'partnership' && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 text-slate-500 mr-2" />
                <h3 className="text-lg font-medium">Partnership Account Requirements</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadBox
                  docType="certificateOfRegistration"
                  label="Certificate of Registration (Original to be sighted)"
                  accountTypeKey="partnership"
                  fileRef={fileInputRefs.certificateOfRegistration}
                />

                <FileUploadBox
                  docType="formOfApplication"
                  label="Form of Application for Registration (Certified by CAC)"
                  accountTypeKey="partnership"
                  fileRef={fileInputRefs.formOfApplication}
                />

                <FileUploadBox
                  docType="validIdOfPartners"
                  label="Valid Identification of Partners"
                  accountTypeKey="partnership"
                  fileRef={fileInputRefs.validIdOfPartners}
                />

                <FileUploadBox
                  docType="proofOfAddress"
                  label="Proof of Address (Utility Bill, Bank Statement, etc.)"
                  accountTypeKey="partnership"
                  fileRef={fileInputRefs.proofOfAddress}
                />
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-medium mb-4">Corporate References (Two independent references required)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-slate-200 rounded-lg">
                    <h5 className="font-medium mb-4">Reference 1</h5>
                    <div className="space-y-4">
                      <TextInput
                        label="Name"
                        name="ref1Name"
                        value={references.ref1Name}
                        placeholder="Company/Individual Name"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Address"
                        name="ref1Address"
                        value={references.ref1Address}
                        placeholder="Full Address"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Phone Number"
                        name="ref1Phone"
                        value={references.ref1Phone}
                        placeholder="Contact Number"
                        onChange={handleReferenceChange}
                      />
                    </div>
                  </div>

                  <div className="p-6 border border-slate-200 rounded-lg">
                    <h5 className="font-medium mb-4">Reference 2</h5>
                    <div className="space-y-4">
                      <TextInput
                        label="Name"
                        name="ref2Name"
                        value={references.ref2Name}
                        placeholder="Company/Individual Name"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Address"
                        name="ref2Address"
                        value={references.ref2Address}
                        placeholder="Full Address"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Phone Number"
                        name="ref2Phone"
                        value={references.ref2Phone}
                        placeholder="Contact Number"
                        onChange={handleReferenceChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Show auto-filled data notice */}
              {extractedDocumentData.certificateOfRegistration && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">Data Extracted Successfully</h4>
                  <p className="text-sm text-blue-700">
                    We've automatically extracted the following information:
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 list-disc pl-5">
                    {extractedDocumentData.certificateOfRegistration.businessName && (
                      <li>Business Name: {extractedDocumentData.certificateOfRegistration.businessName}</li>
                    )}
                    {extractedDocumentData.certificateOfRegistration.registrationNumber && (
                      <li>Registration Number: {extractedDocumentData.certificateOfRegistration.registrationNumber}</li>
                    )}
                    {extractedDocumentData.certificateOfRegistration.registrationDate && (
                      <li>Registration Date: {extractedDocumentData.certificateOfRegistration.registrationDate}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Enterprise Account Requirements */}
          {accountType === 'enterprise' && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Building2 className="h-5 w-5 text-slate-500 mr-2" />
                <h3 className="text-lg font-medium">Enterprise Account Requirements</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadBox
                  docType="certificateOfRegistration"
                  label="Certificate of Registration (Original to be sighted)"
                  accountTypeKey="enterprise"
                  fileRef={fileInputRefs.certificateOfRegistration}
                />

                <FileUploadBox
                  docType="formOfApplication"
                  label="Form of Application for Registration (Certified by CAC)"
                  accountTypeKey="enterprise"
                  fileRef={fileInputRefs.formOfApplication}
                />

                <FileUploadBox
                  docType="passportPhotos"
                  label="Two recent passport-size photographs of each owner"
                  accountTypeKey="enterprise"
                  fileRef={fileInputRefs.passportPhotos}
                />

                <FileUploadBox
                  docType="utilityReceipt"
                  label="Photocopy of Public Utility Receipt (Original sighted)"
                  accountTypeKey="enterprise"
                  fileRef={fileInputRefs.utilityReceipt}
                />

                <div className="md:col-span-2">
                  <FileUploadBox
                    docType="businessOwnerID"
                    label="Valid Identification of Business Owner"
                    accountTypeKey="enterprise"
                    fileRef={fileInputRefs.businessOwnerID}
                  />
                </div>
              </div>

              <div className="mt-6">
                <TextInput
                  label="Company's Operating Business Address"
                  name="businessAddress"
                  value={businessAddress}
                  placeholder="Full business address"
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-medium mb-4">Corporate References (Two independent references required)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-slate-200 rounded-lg">
                    <h5 className="font-medium mb-4">Reference 1</h5>
                    <div className="space-y-4">
                      <TextInput
                        label="Name"
                        name="ref1Name"
                        value={references.ref1Name}
                        placeholder="Company/Individual Name"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Address"
                        name="ref1Address"
                        value={references.ref1Address}
                        placeholder="Full Address"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Phone Number"
                        name="ref1Phone"
                        value={references.ref1Phone}
                        placeholder="Contact Number"
                        onChange={handleReferenceChange}
                      />
                    </div>
                  </div>

                  <div className="p-6 border border-slate-200 rounded-lg">
                    <h5 className="font-medium mb-4">Reference 2</h5>
                    <div className="space-y-4">
                      <TextInput
                        label="Name"
                        name="ref2Name"
                        value={references.ref2Name}
                        placeholder="Company/Individual Name"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Address"
                        name="ref2Address"
                        value={references.ref2Address}
                        placeholder="Full Address"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Phone Number"
                        name="ref2Phone"
                        value={references.ref2Phone}
                        placeholder="Contact Number"
                        onChange={handleReferenceChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Limited Liability Account Requirements */}
          {accountType === 'llc' && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-slate-500 mr-2" />
                <h3 className="text-lg font-medium">Limited Liability Account Requirements</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadBox
                  docType="certificateOfIncorporation"
                  label="Certificate of Incorporation / Registration Number"
                  accountTypeKey="llc"
                  fileRef={fileInputRefs.certificateOfIncorporation}
                />

                <FileUploadBox
                  docType="memorandumArticles"
                  label="Memorandum and Articles of Association"
                  accountTypeKey="llc"
                  fileRef={fileInputRefs.memorandumArticles}
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextInput
                    label="Tax Identification Number (TIN)"
                    name="taxNumber"
                    value={taxInfo.taxNumber}
                    placeholder="Enter TIN"
                    onChange={handleTaxInfoChange}
                  />

                  <TextInput
                    label="SCUML Registration Number (if applicable)"
                    name="scumlNumber"
                    value={taxInfo.scumlNumber}
                    placeholder="Enter SCUML Number"
                    onChange={handleTaxInfoChange}
                  />
                </div>

                <FileUploadBox
                  docType="boardResolution"
                  label="Board Resolution authorizing the account opening"
                  accountTypeKey="llc"
                  fileRef={fileInputRefs.boardResolution}
                />

                <FileUploadBox
                  docType="directorsID"
                  label="Valid Identification of Directors and Signatories"
                  accountTypeKey="llc"
                  fileRef={fileInputRefs.directorsID}
                />

                <FileUploadBox
                  docType="proofOfAddress"
                  label="Proof of Address (Utility Bill, Bank Statement, etc.)"
                  accountTypeKey="llc"
                  fileRef={fileInputRefs.proofOfAddress}
                />
              </div>

              <div className="mt-6">
                <TextInput
                  label="Company's Operating Business Address"
                  name="businessAddress"
                  value={businessAddress}
                  placeholder="Full business address"
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-medium mb-4">Corporate References (Two independent references required)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-slate-200 rounded-lg">
                    <h5 className="font-medium mb-4">Reference 1</h5>
                    <div className="space-y-4">
                      <TextInput
                        label="Name"
                        name="ref1Name"
                        value={references.ref1Name}
                        placeholder="Company/Individual Name"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Address"
                        name="ref1Address"
                        value={references.ref1Address}
                        placeholder="Full Address"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Phone Number"
                        name="ref1Phone"
                        value={references.ref1Phone}
                        placeholder="Contact Number"
                        onChange={handleReferenceChange}
                      />
                    </div>
                  </div>

                  <div className="p-6 border border-slate-200 rounded-lg">
                    <h5 className="font-medium mb-4">Reference 2</h5>
                    <div className="space-y-4">
                      <TextInput
                        label="Name"
                        name="ref2Name"
                        value={references.ref2Name}
                        placeholder="Company/Individual Name"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Address"
                        name="ref2Address"
                        value={references.ref2Address}
                        placeholder="Full Address"
                        onChange={handleReferenceChange}
                      />
                      <TextInput
                        label="Phone Number"
                        name="ref2Phone"
                        value={references.ref2Phone}
                        placeholder="Contact Number"
                        onChange={handleReferenceChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">There was a problem with your submission</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium rounded-lg transition-colors flex items-center justify-center`}
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : 'Submit Documents'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadKYCDocumentsPage;
