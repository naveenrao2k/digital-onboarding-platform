'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Upload, CheckCircle, User, Building, Building2, FileText } from 'lucide-react';
import { div } from 'framer-motion/client';



const UploadKYCDocumentsPage = () => {
  const router = useRouter();
  const [accountType, setAccountType] = useState('individual');
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string, accountTypeKey: 'individual' | 'partnership' | 'enterprise' | 'llc') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save data to local storage based on account type
    let documentsToSave = {};

    switch (accountType) {
      case 'individual':
        documentsToSave = {
          accountType,
          documents: {
            idCard: individualDocuments.idCard ? individualDocuments.idCard.name : null,
            passport: individualDocuments.passport ? individualDocuments.passport.name : null,
            utilityBill: individualDocuments.utilityBill ? individualDocuments.utilityBill.name : null,
          }
        };
        break;
      case 'partnership':
        documentsToSave = {
          accountType,
          documents: {
            certificateOfRegistration: partnershipDocuments.certificateOfRegistration ? partnershipDocuments.certificateOfRegistration.name : null,
            formOfApplication: partnershipDocuments.formOfApplication ? partnershipDocuments.formOfApplication.name : null,
            validIdOfPartners: partnershipDocuments.validIdOfPartners ? partnershipDocuments.validIdOfPartners.name : null,
            proofOfAddress: partnershipDocuments.proofOfAddress ? partnershipDocuments.proofOfAddress.name : null,
          },
          references
        };
        break;
      case 'enterprise':
        documentsToSave = {
          accountType,
          documents: {
            certificateOfRegistration: enterpriseDocuments.certificateOfRegistration ? enterpriseDocuments.certificateOfRegistration.name : null,
            formOfApplication: enterpriseDocuments.formOfApplication ? enterpriseDocuments.formOfApplication.name : null,
            passportPhotos: enterpriseDocuments.passportPhotos ? enterpriseDocuments.passportPhotos.name : null,
            utilityReceipt: enterpriseDocuments.utilityReceipt ? enterpriseDocuments.utilityReceipt.name : null,
            businessOwnerID: enterpriseDocuments.businessOwnerID ? enterpriseDocuments.businessOwnerID.name : null,
          },
          businessAddress,
          references
        };
        break;
      case 'llc':
        documentsToSave = {
          accountType,
          documents: {
            certificateOfIncorporation: llcDocuments.certificateOfIncorporation ? llcDocuments.certificateOfIncorporation.name : null,
            memorandumArticles: llcDocuments.memorandumArticles ? llcDocuments.memorandumArticles.name : null,
            boardResolution: llcDocuments.boardResolution ? llcDocuments.boardResolution.name : null,
            directorsID: llcDocuments.directorsID ? llcDocuments.directorsID.name : null,
            proofOfAddress: llcDocuments.proofOfAddress ? llcDocuments.proofOfAddress.name : null,
          },
          taxInfo,
          businessAddress,
          references
        };
        break;
    }

    localStorage.setItem('kycDocuments', JSON.stringify(documentsToSave));
    setIsSubmitted(true);
    // We'll handle navigation in the success screen component
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

    fileName = fileNames[docType as keyof typeof fileNames];

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
        <div className={`border-2 border-dashed rounded-lg p-6 ${isFileUploaded ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-blue-400'}`}>
          {isFileUploaded ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 text-center">{fileName}</p>
              <p className="text-sm text-green-600 mt-1">File uploaded successfully</p>
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

  // If documents are submitted, show success screen
  if (isSubmitted) {
    return <SuccessScreen />;
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

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Documents
          </button>
        </form>
      </div>


    </div>






  );
};

export default UploadKYCDocumentsPage;