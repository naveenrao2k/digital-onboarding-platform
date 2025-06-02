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
  const userId = params.id as string;
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
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
      setUserDetails(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    documentId: string, 
    status: string, 
    notes: string, 
    rejectionReason?: string, 
    allowReupload?: boolean
  ) => {
    try {
      setIsReviewing(true);
      
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
        throw new Error('Failed to submit review');
      }

      // Refresh user details to show updated status
      await fetchUserDetails();
      
      // Show success message (you might want to add a toast notification here)
      alert('Review submitted successfully!');
    } catch (error: any) {
      alert(`Error submitting review: ${error.message}`);
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

  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download document');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User status badge */}
      <div className="flex justify-end mb-4">
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
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Verification Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Progress</span>
                  <span className="font-medium">{userDetails.verificationStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${userDetails.verificationStatus.progress}%` }}
                  ></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">KYC Documents</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(userDetails.verificationStatus.kycStatus)}
                      <span className="text-sm">{userDetails.verificationStatus.kycStatus}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Selfie Verification</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(userDetails.verificationStatus.selfieStatus)}
                      <span className="text-sm">{userDetails.verificationStatus.selfieStatus}</span>
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
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Verifications</span>
                  <span className="font-medium">{userDetails.dojahVerifications.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Government Lookups</span>
                  <span className="font-medium">{userDetails.dojahVerifications.governmentVerifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">AML Screenings</span>
                  <span className="font-medium">{userDetails.dojahVerifications.amlScreenings.length}</span>
                </div>
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
          </div>

          <div className="space-y-6">
            {userDetails.documents.map((document) => (
              <DojahVerificationDisplay
                key={document.id}
                document={document}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(review.status)}`}>
                      {getStatusIcon(review.status)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {review.verificationType.replace(/_/g, ' ')} Review
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {review.reviewer.firstName} {review.reviewer.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {review.reviewNotes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 font-medium">Review Notes:</p>
                    <p className="text-sm text-gray-800">{review.reviewNotes}</p>
                  </div>
                )}

                {review.rejectionReason && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 font-medium">Rejection Reason:</p>
                    <p className="text-sm text-red-800">{review.rejectionReason}</p>
                  </div>
                )}

                {review.allowReupload && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">✓ User allowed to reupload document</p>
                  </div>
                )}
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
