'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  History,
  Download,
  Eye
} from 'lucide-react';
import DojahVerificationDisplay from '@/components/admin/DojahVerificationDisplay';
import { useHeader } from '../../layout';

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  accountType: string;
  accountStatus: string;
  createdAt: string;
  verificationStatus: {
    overallStatus: string;
    kycStatus: string;
    selfieStatus: string;
    progress: number;
  };
  selfieVerification?: {
    id: string;
    status: string;
    fileUrl: string;
    capturedAt: string;
    fileName: string;

  };
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    uploadedAt: string;
    status: string;
    fileSize: number;
    mimeType: string;
    documentAnalysis?: any;
    dojahVerification?: any;
  }>;
  documentDetails: any;
  dojahVerifications: {
    total: number;
    governmentVerifications: Array<any>;
    amlScreenings: Array<any>;
  };
  adminReviews: Array<{
    id: string;
    verificationType: string;
    status: string;
    reviewNotes?: string;
    rejectionReason?: string;
    allowReupload: boolean;
    reviewer: {
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  canReupload: boolean;
}

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;
  const [userDetails, setUserDetails] = useState<UserDetails | null>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    accountType: '',
    accountStatus: '',
    createdAt: '',
    verificationStatus: {
      overallStatus: '',
      kycStatus: '',
      selfieStatus: '',
      progress: 0
    },
    selfieVerification: {
      id: '',
      status: '',
      fileUrl: '',
      capturedAt: '',
      fileName: ''
    },
    documents: [],
    documentDetails: {},
    dojahVerifications: {
      total: 0,
      governmentVerifications: [],
      amlScreenings: []
    },
    adminReviews: [],
    canReupload: false
  } as UserDetails);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { updateHeader } = useHeader();

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  useEffect(() => {
    if (userDetails) {
      updateHeader(
        `User: ${userDetails.firstName} ${userDetails.lastName}`,
        `User profile and verification details`
      );
    } else {
      updateHeader('User Details', 'Loading user information...');
    }
  }, [userDetails, updateHeader]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      console.log('vishal', data);
      setUserDetails(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [reviewMessage, setReviewMessage] = React.useState<string | null>(null);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  const handleReview = async (
    documentId: string,
    status: string,
    notes: string,
    rejectionReason?: string,
    allowReupload?: boolean
  ) => {
    try {
      setIsReviewing(true);
      setReviewMessage(null);
      setReviewError(null);

      const document = userDetails?.documents.find(d => d.id === documentId);
      const verificationType = document?.type === 'PASSPORT_PHOTOS' ?
        'SELFIE_VERIFICATION' : 'DOCUMENT_VERIFICATION';

      const dojahVerificationId = document?.dojahVerification?.id;

      const response = await fetch('/api/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userDetails?.id,
          documentId,
          verificationType,
          dojahVerificationId,
          status,
          reviewNotes: notes,
          rejectionReason,
          allowReupload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      // Refresh user details to show updated status
      await fetchUserDetails();

      // Show success message
      setReviewMessage('Review submitted successfully!');
    } catch (error: any) {
      setReviewError(`Error submitting review: ${error.message}`);
    } finally {
      setIsReviewing(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadDocument = async (docId: string, docFileName: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setError('Failed to download document');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error || 'User not found'}</div>
      </div>
    );
  }
  return (
    <div className="relative max-w-7xl mx-auto">
      {/* User status badge */}
      <div className="md:absolute right-0 top-2 flex justify-center md:justify-end">
        <div className="flex items-center space-x-2">
          {getStatusIcon(userDetails.verificationStatus.overallStatus)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userDetails.verificationStatus.overallStatus)}`}>
            {userDetails.verificationStatus.overallStatus}
          </span>
        </div>
      </div>


      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'documents', label: 'Documents & Verification', icon: FileText },
            { id: 'history', label: 'Review History', icon: History }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Display review success or error messages */}
      {reviewMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {reviewMessage}
        </div>
      )}
      {reviewError && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          {reviewError}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{userDetails.email}</p>
                  </div>
                </div>

                {userDetails.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{userDetails.phone}</p>
                    </div>
                  </div>
                )}

                {userDetails.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{userDetails.address}</p>
                    </div>
                  </div>
                )}


                {userDetails.dateOfBirth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">{userDetails.dateOfBirth}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Account Information */}
            <div className="bg-white rounded-lg border p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="font-medium">{userDetails.accountType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Status</p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(userDetails.accountStatus)}
                    <span className={`ml-2 px-2 py-0.5 rounded text-sm ${getStatusColor(userDetails.accountStatus)}`}>
                      {userDetails.accountStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">{new Date(userDetails.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>            <div className="bg-white rounded-lg border p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Selfie Verification</h2>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(userDetails.selfieVerification?.status ?? '')}
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(userDetails.selfieVerification?.status ?? '')}`}>
                    {userDetails.selfieVerification?.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                {/* Selfie Image */}
                <div className="relative">
                  <div className="w-50 h-50 rounded-lg overflow-hidden bg-gray-100 border">
                    {userDetails.selfieVerification?.fileUrl ? (
                      <img
                        src={userDetails.selfieVerification.fileUrl}
                        alt="User Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Details */}
                <div className="space-y-4">
                  <div>                    
                    <p className="text-sm text-gray-600">Captured At</p>
                    {userDetails.selfieVerification?.capturedAt && (
                      <div className="space-y-1">
                        <p className="font-medium">
                          {new Date(userDetails.selfieVerification.capturedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(userDetails.selfieVerification.capturedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                            timeZoneName: 'short'
                          })}
                        </p>
                      </div>
                    )}
                    {!userDetails.selfieVerification?.capturedAt && (
                      <p className="font-medium">N/A</p>
                    )}
                  </div>



                  {userDetails.selfieVerification?.fileUrl && (
                    <a
                      href={userDetails.selfieVerification.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Full Size</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Verification Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Summary</h3>
              <div className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="font-medium">{userDetails.verificationStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${userDetails.verificationStatus.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Verification Stages */}
                <div className="border-t pt-4 space-y-3">
                  {/* KYC Status */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">KYC Documents</p>
                      <p className="text-xs text-gray-500">Identity verification</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      {getStatusIcon(userDetails.verificationStatus.kycStatus)}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(userDetails.verificationStatus.kycStatus)}`}>
                        {userDetails.verificationStatus.kycStatus}
                      </span>
                    </div>
                  </div>

                  {/* Selfie Status */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Selfie Verification</p>
                      <p className="text-xs text-gray-500">Liveness check & face match</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      {getStatusIcon(userDetails.verificationStatus.selfieStatus)}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(userDetails.verificationStatus.selfieStatus)}`}>
                        {userDetails.verificationStatus.selfieStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dojah Summary */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Dojah Verification</h3>
              </div>

              {/* Verification Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Total Verifications</p>
                  <p className="text-2xl font-semibold text-blue-700">
                    {userDetails?.dojahVerifications?.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Success Rate</p>
                  <p className="text-2xl font-semibold text-green-700">
                    {userDetails?.dojahVerifications?.total ?
                      Math.round((userDetails.dojahVerifications.governmentVerifications.filter(v => v.isMatch).length /
                        userDetails.dojahVerifications.total) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Verification Types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-600">Government Lookups</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {userDetails?.dojahVerifications?.governmentVerifications?.length || 0}
                    </span>
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-600">AML Screenings</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {userDetails?.dojahVerifications?.amlScreenings?.length || 0}
                    </span>
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Latest Verification */}
                {userDetails?.dojahVerifications?.governmentVerifications?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Latest Verification</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {userDetails.dojahVerifications.governmentVerifications[0].type.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(userDetails.dojahVerifications.governmentVerifications[0].status)
                        }`}>
                        {userDetails.dojahVerifications.governmentVerifications[0].status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Documents & Dojah Verification</h2>
            <div className="text-sm text-gray-600">
              {userDetails.documents.length} document{userDetails.documents.length !== 1 ? 's' : ''} uploaded
            </div>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userDetails.documents.map((document, i) => (
              <DojahVerificationDisplay
                key={document.id}
                document={document}
                documentDetails={userDetails.documentDetails[i]}
                governmentVerifications={userDetails.dojahVerifications.governmentVerifications}
                onReview={handleReview}
                isReviewing={isReviewing}
              />
            ))}
          </div>

          {userDetails.documents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents uploaded yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Review History</h2>

          <div className="space-y-4">
            {userDetails.adminReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg border p-6">
                {/* Review Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(review.status)}`}>
                      {getStatusIcon(review.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {review.verificationType.replace(/_/g, ' ')}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Details */}
                <div className="space-y-4">
                  {/* Review Notes */}
                  {review.reviewNotes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-700">Review Notes</p>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{review.reviewNotes}</p>
                    </div>
                  )}

                  {/* Rejection Details */}
                  {review.rejectionReason && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-sm font-medium text-red-700">Rejection Details</p>
                      </div>
                      <p className="text-sm text-red-800 whitespace-pre-wrap">{review.rejectionReason}</p>
                    </div>
                  )}

                  {/* Reupload Status */}
                  {review.allowReupload && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">User is allowed to reupload documents</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {userDetails.adminReviews.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No review history available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
