'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Shield,
  Bell,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Camera,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface UserDocument {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  status: string;
}

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  accountType: string;
  accountStatus: string;
  createdAt: string;
  verificationStatus: {
    overallStatus: string;
    kycStatus: string;
    selfieStatus: string;
    progress: number;
  };
  documents: UserDocument[];
}

const UserDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = params.id as string;
  
  // Check if admin is authenticated
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/signin');
      } else if (user.role !== 'ADMIN') {
        // Redirect non-admin users
        // router.push('/user/dashboard');
      } else {
        // Fetch user details
        fetchUserDetails();
      }
    }
  }, [user, loading, router, userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch user details from API
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user details');
      }
      
      const data = await response.json();
      setUserDetails(data || {
        id: userId,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, New York, NY 10001',
        dateOfBirth: '1990-05-15',
        accountType: 'INDIVIDUAL',
        accountStatus: 'PENDING',
        createdAt: '2025-05-20',
        verificationStatus: {
          overallStatus: 'IN_PROGRESS',
          kycStatus: 'APPROVED',
          selfieStatus: 'PENDING',
          progress: 65
        },
        documents: [
          {
            id: 'doc_1',
            type: 'Passport',
            fileName: 'passport.jpg',
            uploadedAt: '2025-05-22',
            status: 'APPROVED'
          },
          {
            id: 'doc_2',
            type: 'Utility Bill',
            fileName: 'utility_bill.pdf',
            uploadedAt: '2025-05-22',
            status: 'PENDING'
          },
          {
            id: 'doc_3',
            type: 'Selfie Verification',
            fileName: 'selfie.jpg',
            uploadedAt: '2025-05-23',
            status: 'PENDING'
          }
        ]
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDocument = async (documentId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Approving document:', documentId);
      
      // Update the document status locally
      if (userDetails) {
        const updatedDocuments = userDetails.documents.map(doc => {
          if (doc.id === documentId) {
            return { ...doc, status: 'APPROVED' };
          }
          return doc;
        });
        
        setUserDetails({
          ...userDetails,
          documents: updatedDocuments
        });
      }
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error approving document:', err);
      // Show error notification
    }
  };

  const handleRejectDocument = async (documentId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Rejecting document:', documentId);
      
      // Update the document status locally
      if (userDetails) {
        const updatedDocuments = userDetails.documents.map(doc => {
          if (doc.id === documentId) {
            return { ...doc, status: 'REJECTED' };
          }
          return doc;
        });
        
        setUserDetails({
          ...userDetails,
          documents: updatedDocuments
        });
      }
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error rejecting document:', err);
      // Show error notification
    }
  };

  const handleApproveAccount = async () => {
    try {
      if (!userDetails) return;
      
      // In a real implementation, you would call an API endpoint
      console.log('Approving account:', userDetails.id);
      
      // Update the account status locally
      setUserDetails({
        ...userDetails,
        accountStatus: 'APPROVED',
        verificationStatus: {
          ...userDetails.verificationStatus,
          overallStatus: 'APPROVED',
          selfieStatus: 'APPROVED',
          progress: 100
        }
      });
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error approving account:', err);
      // Show error notification
    }
  };

  const handleRejectAccount = async () => {
    try {
      if (!userDetails) return;
      
      // In a real implementation, you would call an API endpoint
      console.log('Rejecting account:', userDetails.id);
      
      // Update the account status locally
      setUserDetails({
        ...userDetails,
        accountStatus: 'REJECTED',
        verificationStatus: {
          ...userDetails.verificationStatus,
          overallStatus: 'REJECTED'
        }
      });
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error rejecting account:', err);
      // Show error notification
    }
  };

  const handleGoBack = () => {
    router.push('/admin/dashboard');
  };

  // Handle loading state
  if (loading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-2 text-lg">Loading user details...</p>
      </div>
    );
  }

  // Handle error state
  if (error || !userDetails) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading User</h2>
          <p className="text-gray-600 mb-6">{error || 'Could not find user details'}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => fetchUserDetails()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">KYC Admin</span>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
        
        {/* User details header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl mr-4">
              {userDetails.firstName.charAt(0)}{userDetails.lastName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userDetails.firstName} {userDetails.lastName}</h1>
              <p className="text-gray-600">User ID: {userDetails.id}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {userDetails.accountStatus === 'PENDING' && (
              <>
                <button
                  onClick={handleApproveAccount}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                >
                  Approve Account
                </button>
                <button
                  onClick={handleRejectAccount}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                >
                  Reject Account
                </button>
              </>
            )}
            
            {userDetails.accountStatus === 'APPROVED' && (
              <div className="px-4 py-2 bg-green-100 text-green-800 font-medium rounded-lg flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Account Approved
              </div>
            )}
            
            {userDetails.accountStatus === 'REJECTED' && (
              <div className="px-4 py-2 bg-red-100 text-red-800 font-medium rounded-lg flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Account Rejected
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2">
            {/* User information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">User Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email Address</p>
                      <p className="font-medium">{userDetails.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                      <p className="font-medium">{userDetails.phone || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                      <p className="font-medium">{userDetails.dateOfBirth || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Type</p>
                      <p className="font-medium">{userDetails.accountType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start md:col-span-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="font-medium">{userDetails.address || "Address not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Documents */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Submitted Documents</h2>
                <div className="space-y-4">
                  {userDetails.documents.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                            {document.type.includes('Selfie') ? (
                              <Camera className="h-5 w-5 text-blue-600" />
                            ) : (
                              <FileText className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{document.type}</p>
                            <p className="text-sm text-gray-500">Filename: {document.fileName}</p>
                            <p className="text-sm text-gray-500">Uploaded: {document.uploadedAt}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          document.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          document.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {document.status}
                        </span>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleDownloadDocument(document.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded flex items-center"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Download
                        </button>
                        <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-medium rounded flex items-center">
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Preview
                        </button>
                        
                        {document.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleApproveDocument(document.id)}
                              className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded flex items-center"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectDocument(document.id)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded flex items-center"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Verification Status */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
              <div className="p-6">
                <h3 className="font-bold mb-4">Verification Status</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className="font-medium text-blue-600">{userDetails.verificationStatus.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${userDetails.verificationStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    {userDetails.verificationStatus.kycStatus === 'APPROVED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">KYC Documents</p>
                      <p className="text-gray-500 text-xs">
                        {userDetails.verificationStatus.kycStatus === 'APPROVED' ? 'Verified' : 'Under review'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    {userDetails.verificationStatus.selfieStatus === 'APPROVED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">Selfie Verification</p>
                      <p className="text-gray-500 text-xs">
                        {userDetails.verificationStatus.selfieStatus === 'APPROVED' ? 'Verified' : 'Under review'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Account Status */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6">
                <h3 className="font-bold mb-4">Account Details</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Registration Date</p>
                      <p className="text-gray-500">{userDetails.createdAt}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`h-4 w-4 rounded-full mt-0.5 mr-2 flex-shrink-0 ${
                      userDetails.accountStatus === 'APPROVED' ? 'bg-green-500' :
                      userDetails.accountStatus === 'REJECTED' ? 'bg-red-500' :
                      'bg-amber-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className={`${
                        userDetails.accountStatus === 'APPROVED' ? 'text-green-600' :
                        userDetails.accountStatus === 'REJECTED' ? 'text-red-600' :
                        'text-amber-600'
                      }`}>
                        {userDetails.accountStatus}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDetailsPage;
