// components/admin/DojahVerificationDisplay.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Shield,
  User,
  Activity,
  RotateCcw,
  Timer,
  BarChart
} from 'lucide-react';

interface DojahVerificationProps {
  document: {
    id: string;
    type: string;
    fileName: string;
    status: string;
    documentAnalysis?: {
      extractedText?: string;
      extractedData?: any;
      documentType?: string;
      confidence?: number;
      isReadable: boolean;
      qualityScore?: number;
    };
    dojahVerification?: {
      id: string;
      status: string;
      confidence?: number;
      matchResult?: any;
      extractedData?: any;
      governmentData?: any;
      errorMessage?: string;
      createdAt: string;
      steps?: Array<{
        name: string;
        status: string;
        completedAt?: string;
        duration?: number;
      }>;
    };
  };
  documentDetails?: {
    id: string;
    userId: string;
    type: "ID_CARD" | "PASSPORT" | "UTILITY_BILL" | string;
    fileUrl: string;
    s3Key: string;
    fileSize: number;
    mimeType: string;
    fileName: string;
    uploadedAt: string;
    verified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    status: string;
    notes: string | null;
  };
  governmentVerifications: Array<{
    type: string;
    status: string;
    isMatch: boolean;
    confidence?: number;
    governmentData?: any;
    createdAt: string;
  }>;
  onReview: (documentId: string, status: string, notes: string, rejectionReason?: string, allowReupload?: boolean) => void;
  isReviewing: boolean;
}

export default function DojahVerificationDisplay({
  document,
  documentDetails,
  governmentVerifications,
  onReview,
  isReviewing
}: DojahVerificationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState(''); const [allowReupload, setAllowReupload] = useState(false);

  // Use document detail info if available
  const documentInfo = documentDetails || document;
  const documentType = documentInfo.type;

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, isMatch?: boolean) => {
    if (isMatch !== undefined) {
      return isMatch ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200';
    }

    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'SUCCESS':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const handleReview = () => {
    if (!reviewStatus) return;

    onReview(
      document.id,
      reviewStatus,
      reviewNotes,
      reviewStatus === 'REJECTED' ? rejectionReason : undefined,
      reviewStatus === 'REJECTED' ? allowReupload : false
    );

    // Reset form
    setReviewStatus('');
    setReviewNotes('');
    setRejectionReason('');
    setAllowReupload(false);
  };

  const relevantGovVerifications = governmentVerifications.filter(gv =>
    document.dojahVerification?.extractedData &&
    Object.keys(document.dojahVerification.extractedData).some(key =>
      gv.type.toLowerCase().includes(key.toLowerCase())
    )
  );

  // Calculate verification steps with status
  const verificationSteps = [
    {
      name: 'Document Upload',
      status: 'SUCCESS',
      completedAt: document.dojahVerification?.createdAt,
    },
    {
      name: 'Quality Check',
      status: document.documentAnalysis?.isReadable ? 'SUCCESS' : 'FAILED',
      score: document.documentAnalysis?.qualityScore,
    },
    {
      name: 'Data Extraction',
      status: document.dojahVerification?.extractedData ? 'SUCCESS' : 'FAILED',
      confidence: document.dojahVerification?.confidence,
    },
    {
      name: 'Government Database Match',
      status: relevantGovVerifications.length > 0 ?
        relevantGovVerifications.every(v => v.isMatch) ? 'SUCCESS' : 'FAILED' :
        'PENDING',
    }
  ];
  console.log('Detailed debug information:', {
    showDetails,
    hasDocumentAnalysis: !!document.documentAnalysis,
    hasExtractedData: !!(document.documentAnalysis?.extractedData || document.dojahVerification?.extractedData),
    hasGovernmentData: !!document.dojahVerification?.governmentData,
    hasExtractedText: !!document.documentAnalysis?.extractedText,
    documentAnalysisData: document.documentAnalysis?.extractedData,
    dojahVerificationData: document.dojahVerification?.extractedData,
    governmentData: document.dojahVerification?.governmentData,
  });

  // Debug logging
  console.log('DojahVerificationDisplay render:', {
    showDetails,
    documentAnalysis: document.documentAnalysis ?? 'undefined',
    dojahVerification: document.dojahVerification ?? 'undefined',
    hasExtractedData: !!(document.documentAnalysis?.extractedData || document.dojahVerification?.extractedData),
    hasGovernmentData: !!document.dojahVerification?.governmentData,
    hasExtractedText: !!document.documentAnalysis?.extractedText
  });

  return (
    <div className="border rounded-lg p-6 space-y-4">
      {/* Document Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-gray-500" />          <div>            <h3 className="font-medium text-gray-900">{documentInfo.fileName}</h3>
            <p className="text-sm text-gray-500">{documentType.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(document.status)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
            {document.status}
          </span>
        </div>
      </div>

      {/* API Verification Status */}
      {document.dojahVerification && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Dojah Verification Status</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(document.dojahVerification.status)}
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.dojahVerification.status)}`}>
                {document.dojahVerification.status}
              </span>
            </div>
          </div>

          {/* Verification Steps Timeline */}
          <div className="space-y-3">
            {verificationSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                {getStatusIcon(step.status)}
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{step.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(step.status)}`}>
                      {step.status}
                    </span>
                  </div>
                  {step.score !== undefined && (
                    <div className="mt-1 flex items-center text-xs text-gray-600">
                      <BarChart className="h-3 w-3 mr-1" />
                      Quality Score: {step.score}%
                    </div>
                  )}
                  {step.confidence !== undefined && (
                    <div className="mt-1 flex items-center text-xs text-gray-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Confidence: {step.confidence}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Message Display */}
          {document.dojahVerification.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium text-red-800">Verification Error</p>
                  <p className="text-sm text-red-700">{document.dojahVerification.errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Government Verification Results */}
      {relevantGovVerifications.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Government Verification Results</span>
          </div>

          <div className="space-y-2">
            {relevantGovVerifications.map((gv, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <span className="text-sm font-medium block">{gv.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-500">
                    Verified on {new Date(gv.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-gray-600">
                      {gv.confidence ? `${gv.confidence}%` : 'N/A'}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(gv.status, gv.isMatch)}`}>
                    {gv.isMatch ? 'Match' : 'No Match'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}      {/* View Details Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
      >
        <Eye className="h-4 w-4" />
        <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
      </button>      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* No Data Message */}
          {!documentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">No detailed information available for this document.</p>
            </div>
          )}
          {documentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Document Details</h4>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Upload Date</dt>
                  <dd className="font-medium">{new Date(documentDetails.uploadedAt).toLocaleString()}</dd>
                </div>
               
                
               
                <div>
                  <dt className="text-gray-500">Document ID</dt>
                  <dd className="font-medium">{documentDetails.id}</dd>
                </div>
                
                <div>
                  <dt className="text-gray-500">Verification Status</dt>
                  <dd className="font-medium">{documentDetails.verified ? 'Verified' : 'Pending'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500"></dt>
                  <dd className="font-medium"></dd>
                </div>
                {documentDetails.verifiedAt && (
                  <div>
                    <dt className="text-gray-500">Verified On</dt>
                    <dd className="font-medium">{new Date(documentDetails.verifiedAt).toLocaleString()}</dd>
                  </div>
                )}

                 <div>
                  <p className="text-gray-500">Doc Preview</p>
                  <div className="font-medium">
                    <Image src={documentDetails.fileUrl} alt={documentDetails.fileName} width={200} height={500} className="w-full inline-block mr-2" />
                  </div>
                </div>
              </dl>
            </div>
          )}
          {/* Extracted Data */}
          {(document.dojahVerification?.extractedData || document.documentAnalysis?.extractedData) && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Extracted Data
              </h4>
              <div className="bg-gray-50 rounded p-3">
                <div className="space-y-4">
                  {document.dojahVerification?.extractedData && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Dojah Verification Data</h5>
                      <pre className="whitespace-pre-wrap text-xs text-gray-800 overflow-x-auto">
                        {JSON.stringify(document.dojahVerification.extractedData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {document.documentAnalysis?.extractedData && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Document Analysis Data</h5>
                      <pre className="whitespace-pre-wrap text-xs text-gray-800 overflow-x-auto">
                        {JSON.stringify(document.documentAnalysis.extractedData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Government Data */}
          {document.dojahVerification?.governmentData && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                Government Data
              </h4>
              <div className="bg-gray-50 rounded p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-800 overflow-x-auto">
                  {JSON.stringify(document.dojahVerification.governmentData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Extracted Text */}
          {document.documentAnalysis?.extractedText && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                Extracted Text
              </h4>
              <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {document.documentAnalysis.extractedText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Review Section */}
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-purple-900">Admin Review</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Decision
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Decision</option>
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
              <option value="REQUIRES_ADDITIONAL_INFO">Request Additional Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add your review notes..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {reviewStatus === 'REJECTED' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify the reason for rejection..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowReupload"
                  checked={allowReupload}
                  onChange={(e) => setAllowReupload(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowReupload" className="text-sm text-gray-700">
                  Allow user to reupload document
                </label>
              </div>
            </>
          )}

          <button
            onClick={handleReview}
            disabled={!reviewStatus || isReviewing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center space-x-2"
          >
            {isReviewing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Review</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}