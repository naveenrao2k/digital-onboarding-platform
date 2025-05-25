'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Upload, CheckCircle, User, Building, Building2, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { uploadKycDocument, getVerificationStatus } from '@/lib/file-upload-service';
import { DocumentType } from '@/app/generated/prisma';
import { useVerificationStore } from '@/lib/verification-store';

// Helper function to convert form docType to valid DocumentType enum
const docTypeToEnumMapping = (docType: string): DocumentType => {
  const mapping: {[key: string]: DocumentType} = {
    // Individual documents
    idCard: DocumentType.ID_CARD,
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
  const [accountType, setAccountType] = useState('individual');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  
  // Use the verification store for state management
  const { 
    documents, 
    isLoading: isLoadingVerification,
    fetchVerificationStatus 
  } = useVerificationStore();
    // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/access');
    } else if (user && !hasCheckedStatus) {
      // Fetch verification status to check if documents have been submitted
      // But only do this once to prevent endless loops
      setHasCheckedStatus(true);
      fetchVerificationStatus(user.id).then(() => {
        // Check document status but don't redirect automatically
        // This allows users to upload one of each document type
        if (documents && documents.length > 0) {
          setAlreadySubmitted(false); // Don't block new uploads, we'll check per document
        }
      });
    }
  }, [user, loading, router, hasCheckedStatus, documents, fetchVerificationStatus]);
  
  // We don't need the second effect that redirects automatically
  // This was causing the issue by preventing multiple document uploads
  
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});

  // Individual account documents
  const [individualDocuments, setIndividualDocuments] = useState({
    idCard: null as File | null,
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
    idCard: '',
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
    idCard: useRef<HTMLInputElement>(null),
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

      // Check if this specific document type has already been uploaded
      const documentEnum = docTypeToEnumMapping(docType);
      const docTypeFormatted = documentEnum.toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      
      // Check if this specific document exists in the documents array
      const hasThisDocType = documents?.some(doc => doc.type === docTypeFormatted);
      
      if (hasThisDocType) {
        setError(`You've already uploaded a ${docType.replace(/([A-Z])/g, ' $1').trim()}. Please use the 'Change File' option to replace it.`);
        return;
      }

      // Update the appropriate document state based on account type
      switch (accountTypeKey) {
        case 'individual':
          setIndividualDocuments(prev => ({ ...prev, [docType]: file }));
          break;
        case 'partnership':
          setPartnershipDocuments(prev => ({ ...prev, [docType]: file }));
          break;
        case 'enterprise':
          setEnterpriseDocuments(prev => ({ ...prev, [docType]: file }));
          break;
        case 'llc':
          setLlcDocuments(prev => ({ ...prev, [docType]: file }));
          break;
      }

      // Update file name for display
      setFileNames(prev => ({ ...prev, [docType]: file.name }));
      
      // Auto-upload the file immediately after selection
      try {
        setUploadStatus(prev => ({ ...prev, [docType]: 'uploading' }));
        
        // Convert docType to proper DocumentType enum format
        const documentType = docTypeToEnumMapping(docType);
          // Call the upload function with progress tracking
        await uploadKycDocument(
          documentType, 
          file,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [docType]: progress }));
          }
        );
        
        // Refresh document list to show the uploaded document
        if (user) {
          await fetchVerificationStatus(user.id);
        }
        
        setUploadStatus(prev => ({ ...prev, [docType]: 'success' }));
      } catch (err) {
        console.error(`Error uploading ${docType}:`, err);
        setUploadStatus(prev => ({ ...prev, [docType]: 'error' }));
        setError(`Failed to upload ${docType}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
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
    
    // We don't need the global alreadySubmitted check anymore since we check per document
    // just proceed with the upload
    
    try {
      // Upload documents based on account type
      let uploadPromises: Promise<any>[] = [];
      let documentsToSave: any = {
        accountType,
        documents: {}
      };
      
      switch (accountType) {
        case 'individual':
          if (individualDocuments.idCard) {
            uploadPromises.push(uploadKycDocument(DocumentType.ID_CARD, individualDocuments.idCard));
            documentsToSave.documents.idCard = individualDocuments.idCard.name;
          }
          
          if (individualDocuments.passport) {
            uploadPromises.push(uploadKycDocument(DocumentType.PASSPORT, individualDocuments.passport));
            documentsToSave.documents.passport = individualDocuments.passport.name;
          }
          
          if (individualDocuments.utilityBill) {
            uploadPromises.push(uploadKycDocument(DocumentType.UTILITY_BILL, individualDocuments.utilityBill));
            documentsToSave.documents.utilityBill = individualDocuments.utilityBill.name;
          }
          break;
          
        case 'partnership':
          if (partnershipDocuments.certificateOfRegistration) {
            uploadPromises.push(uploadKycDocument(DocumentType.CERTIFICATE_OF_REGISTRATION, partnershipDocuments.certificateOfRegistration));
            documentsToSave.documents.certificateOfRegistration = partnershipDocuments.certificateOfRegistration.name;
          }
          
          if (partnershipDocuments.formOfApplication) {
            uploadPromises.push(uploadKycDocument(DocumentType.FORM_OF_APPLICATION, partnershipDocuments.formOfApplication));
            documentsToSave.documents.formOfApplication = partnershipDocuments.formOfApplication.name;
          }
          
          if (partnershipDocuments.validIdOfPartners) {
            uploadPromises.push(uploadKycDocument(DocumentType.VALID_ID_OF_PARTNERS, partnershipDocuments.validIdOfPartners));
            documentsToSave.documents.validIdOfPartners = partnershipDocuments.validIdOfPartners.name;
          }
          
          if (partnershipDocuments.proofOfAddress) {
            uploadPromises.push(uploadKycDocument(DocumentType.PROOF_OF_ADDRESS, partnershipDocuments.proofOfAddress));
            documentsToSave.documents.proofOfAddress = partnershipDocuments.proofOfAddress.name;
          }
          
          documentsToSave.references = references;
          break;
          
        case 'enterprise':
          if (enterpriseDocuments.certificateOfRegistration) {
            uploadPromises.push(uploadKycDocument(DocumentType.CERTIFICATE_OF_REGISTRATION, enterpriseDocuments.certificateOfRegistration));
            documentsToSave.documents.certificateOfRegistration = enterpriseDocuments.certificateOfRegistration.name;
          }
          
          if (enterpriseDocuments.formOfApplication) {
            uploadPromises.push(uploadKycDocument(DocumentType.FORM_OF_APPLICATION, enterpriseDocuments.formOfApplication));
            documentsToSave.documents.formOfApplication = enterpriseDocuments.formOfApplication.name;
          }
          
          if (enterpriseDocuments.passportPhotos) {
            uploadPromises.push(uploadKycDocument(DocumentType.PASSPORT_PHOTOS, enterpriseDocuments.passportPhotos));
            documentsToSave.documents.passportPhotos = enterpriseDocuments.passportPhotos.name;
          }
          
          if (enterpriseDocuments.utilityReceipt) {
            uploadPromises.push(uploadKycDocument(DocumentType.UTILITY_BILL, enterpriseDocuments.utilityReceipt));
            documentsToSave.documents.utilityReceipt = enterpriseDocuments.utilityReceipt.name;
          }
          
          if (enterpriseDocuments.businessOwnerID) {
            uploadPromises.push(uploadKycDocument(DocumentType.ID_CARD, enterpriseDocuments.businessOwnerID));
            documentsToSave.documents.businessOwnerID = enterpriseDocuments.businessOwnerID.name;
          }
          
          documentsToSave.businessAddress = businessAddress;
          documentsToSave.references = references;
          break;
          
        case 'llc':
          if (llcDocuments.certificateOfIncorporation) {
            uploadPromises.push(uploadKycDocument(DocumentType.CERTIFICATE_OF_INCORPORATION, llcDocuments.certificateOfIncorporation));
            documentsToSave.documents.certificateOfIncorporation = llcDocuments.certificateOfIncorporation.name;
          }
          
          if (llcDocuments.memorandumArticles) {
            uploadPromises.push(uploadKycDocument(DocumentType.MEMORANDUM_ARTICLES, llcDocuments.memorandumArticles));
            documentsToSave.documents.memorandumArticles = llcDocuments.memorandumArticles.name;
          }
          
          if (llcDocuments.boardResolution) {
            uploadPromises.push(uploadKycDocument(DocumentType.BOARD_RESOLUTION, llcDocuments.boardResolution));
            documentsToSave.documents.boardResolution = llcDocuments.boardResolution.name;
          }
          
          if (llcDocuments.directorsID) {
            uploadPromises.push(uploadKycDocument(DocumentType.DIRECTORS_ID, llcDocuments.directorsID));
            documentsToSave.documents.directorsID = llcDocuments.directorsID.name;
          }
          
          if (llcDocuments.proofOfAddress) {
            uploadPromises.push(uploadKycDocument(DocumentType.PROOF_OF_ADDRESS, llcDocuments.proofOfAddress));
            documentsToSave.documents.proofOfAddress = llcDocuments.proofOfAddress.name;
          }
          
          documentsToSave.taxInfo = taxInfo;
          documentsToSave.businessAddress = businessAddress;
          documentsToSave.references = references;
          break;
      }

      // Check if there are any documents to upload
      if (uploadPromises.length === 0) {
        setError('Please upload at least one document');
        setIsSubmitting(false);
        return;
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Save metadata to localStorage (for reference and UI state persistence)
      localStorage.setItem('kycDocuments', JSON.stringify(documentsToSave));
      
      // Set submission as complete
      setIsSubmitted(true);
    } catch (err) {
      console.error('Document upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload documents. Please try again.';
      
      // Check for specific error about already submitted documents
      if (errorMessage.includes('Document submission is only allowed once') || 
          errorMessage.includes('Multiple submissions are not allowed')) {
        setAlreadySubmitted(true);
      }
        // Set the error in a more user-friendly format
      if (errorMessage.includes('You have already uploaded')) {
        setError('You can only upload one document of each type. Please use the Change File option to replace an existing document.');
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
          {status === 'uploading' ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-slate-600 text-center">{fileName}</p>
              <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-sm text-blue-600 mt-1">Uploading... {progress}%</p>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
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
              className="flex flex-col items-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
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
                onChange={(e) => handleFileChange(e, docType, accountTypeKey)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Text input component for references
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

  // Success screen component
  const SuccessScreen = () => {
    return (
      <div className="max-h-screen flex items-center justify-center">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadBox
                  docType="idCard"
                  label="ID Card (Front & Back)"
                  accountTypeKey="individual"
                  fileRef={fileInputRefs.idCard}
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
