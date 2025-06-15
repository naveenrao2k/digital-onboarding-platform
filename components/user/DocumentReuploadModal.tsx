'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { DocumentType } from '@/app/generated/prisma';
import { uploadKycDocument } from '@/lib/file-upload-service';

interface DocumentReuploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentType: string;
    onSuccess: () => void;
}

const DocumentReuploadModal: React.FC<DocumentReuploadModalProps> = ({
    isOpen,
    onClose,
    documentId,
    documentType,
    onSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);

        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file size (10MB max)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size exceeds 10MB limit");
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!validTypes.includes(selectedFile.type)) {
                setError("Invalid file type. Please upload JPG, PNG or PDF only");
                return;
            }

            setFile(selectedFile);

            // Create preview if it's an image
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    setFilePreview(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                // For PDFs, show a generic icon
                setFilePreview(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first");
            return;
        }

        try {
            setUploading(true);
            setError(null);

            // Use the document type from props
            const response = await uploadKycDocument(
                documentType as DocumentType,
                file,
                (progress) => setUploadProgress(progress)
            );

            // Call API to update the document status 
            const updateResult = await fetch(`/api/user/kyc-document/reupload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    documentId,
                    newDocumentId: response.id
                }),
            });

            if (!updateResult.ok) {
                const errorData = await updateResult.json();
                throw new Error(errorData.error || "Failed to update document reference");
            }

            // Call the success callback
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    const formatDocumentType = (type: string) => {
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold">Reupload Document</h2>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-700 mb-2">
                            Document Type: <span className="font-medium">{formatDocumentType(documentType)}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            Please upload a new version of this document. Your previous submission was rejected and requires a new upload.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 text-red-700 flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="mb-6">
                        {filePreview ? (
                            <div className="border rounded-lg overflow-hidden mb-4">
                                <img
                                    src={filePreview}
                                    alt="Document preview"
                                    className="max-h-64 mx-auto object-contain"
                                />
                            </div>
                        ) : file ? (
                            <div className="border rounded-lg p-8 flex flex-col items-center justify-center mb-4 bg-gray-50">
                                <FileText className="h-12 w-12 text-gray-400 mb-3" />
                                <span className="text-gray-700 text-sm font-medium">{file.name}</span>
                                <span className="text-gray-500 text-xs mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 mb-4"
                            >
                                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                <span className="text-gray-700">Click to select a file, or drag and drop</span>
                                <span className="text-gray-500 text-sm mt-1">JPG, PNG or PDF (max 10MB)</span>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {!file && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Select file
                            </button>
                        )}
                    </div>

                    {uploading && (
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            className={`py-2 px-4 rounded-lg text-sm font-medium text-white ${uploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            disabled={!file || uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentReuploadModal;
