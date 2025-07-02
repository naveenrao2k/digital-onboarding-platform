'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Phone, MapPin, FileText, AlertCircle, CheckCircle,
  Clock, Headphones, FileQuestion, Shield, Bell, Moon, Sun,
  LogOut, RefreshCw, Building, Building2, User, Upload
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVerificationStore } from '@/lib/verification-store';
import { VerificationStatusEnum, AccountType, DocumentType } from '@/app/generated/prisma';
import { fetchUserProfile, formatAccountType, getStatusBadgeColor } from '@/lib/profile-service';
import type { UserProfile } from '@/lib/profile-service';
import CreditScore from '@/components/dashboard/CreditScore';
import DocumentReuploadModal from '@/components/user/DocumentReuploadModal';




const UserDashboard = () => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycFormData, setKycFormData] = useState<any>(null); // Add state for KYC form data
  const [greeting, setGreeting] = useState('Good afternoon');
  const [darkMode, setDarkMode] = useState(false);

  // State for document re-upload modal
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');

  // Use the verification store for state management
  const {
    overallStatus: verificationStatus,
    progress,
    fetchVerificationStatus,
    resetError
  } = useVerificationStore();

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/access');
    }
  }, [user, loading, router]);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        setIsLoadingProfile(true);
        setError(null);

        // Fetch both user profile and KYC form data
        const [profile, kycResponse] = await Promise.all([
          fetchUserProfile(),
          fetch('/api/user/kyc-form-data').then(res => res.ok ? res.json() : null)
        ]);

        setUserProfile(profile);
        if (kycResponse?.data) {
          setKycFormData(kycResponse.data);
        }

        // Also update verification status
        await fetchVerificationStatus(user.id);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user, fetchVerificationStatus]);

  // Handle document re-upload button click
  const handleReuploadClick = (documentId: string, documentType: string) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentType(documentType);
    setIsReuploadModalOpen(true);
  };

  // Handle successful re-upload
  const handleReuploadSuccess = () => {
    // Refresh the user profile data to show the updated document status
    setIsLoadingProfile(true);
    fetchUserProfile()
      .then(data => {
        setUserProfile(data);
        setIsLoadingProfile(false);
      })
      .catch(err => {
        console.error('Error refreshing profile after reupload:', err);
        setError('Failed to refresh profile data');
        setIsLoadingProfile(false);
      });
  };

  const getAccountTypeIcon = (accountType: AccountType) => {
    switch (accountType) {
      case 'INDIVIDUAL':
        return <User className="h-5 w-5" />;
      case 'PARTNERSHIP':
        return <Building className="h-5 w-5" />;
      case 'ENTERPRISE':
      case 'LLC':
        return <Building2 className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  // Helper function to get SCUML number from either account or KYC form data
  const getSCUMLNumber = () => {
    return userProfile?.account?.scumlNumber || kycFormData?.scumlNumber || null;
  };

  // Check if user has SCUML license
  const hasSCUMLLicense = () => {
    const scumlNumber = getSCUMLNumber();
    const accountType = userProfile?.accountType;
    return scumlNumber && ['PARTNERSHIP', 'ENTERPRISE', 'LLC'].includes(accountType || '');
  };

  if (isLoadingProfile || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center text-red-600 hover:text-red-800"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {greeting}, {userProfile?.firstName || 'User'}
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Welcome back to your dashboard
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-600'
                } hover:bg-opacity-80`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile and Documents */}
          <div className="lg:col-span-2">
            {/* Profile Overview */}
            <section className="mb-8">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Profile Overview</h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeColor(userProfile?.accountStatus || 'PENDING', darkMode)}`}>
                    {userProfile?.accountStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                        <p className="font-medium">{userProfile?.email}</p>
                      </div>
                    </div>

                    {userProfile?.phone && (
                      <div className="flex items-start">
                        <Phone className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                        <div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</p>
                          <p className="font-medium">{userProfile.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {userProfile?.address && (
                      <div className="flex items-start">
                        <MapPin className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                        <div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                          <p className="font-medium">{userProfile.address}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      {getAccountTypeIcon(userProfile?.accountType || 'INDIVIDUAL')}
                      <div className="ml-3">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account Type</p>
                        <p className="font-medium">{formatAccountType(userProfile?.accountType || 'INDIVIDUAL')}</p>
                      </div>
                    </div>

                    {/* SCUML License Information */}
                    {hasSCUMLLicense() && (
                      <div className={`flex items-start p-3 rounded-lg ${darkMode ? 'bg-green-800/20 border border-green-600/30' : 'bg-green-50 border border-green-200'}`}>
                        <div className={`${darkMode ? 'bg-green-700' : 'bg-green-100'} rounded-full p-2`}>
                          <Shield className={`h-5 w-5 ${darkMode ? 'text-green-300' : 'text-green-600'}`} />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>SCUML License</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-green-700 text-green-200' : 'bg-green-100 text-green-800'}`}>
                              Verified
                            </span>
                          </div>
                          <p className={`font-mono text-lg ${darkMode ? 'text-green-200' : 'text-green-900'} mt-1`}>{getSCUMLNumber()}</p>
                          <p className={`text-xs ${darkMode ? 'text-green-300/70' : 'text-green-600'} mt-1`}>
                            Securities and Commodities Market License
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                      <div>
                        <p className="text-red-800 font-medium">Error</p>
                        <p className="text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Verification Status Section */}
            <section className="mb-8">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 shadow-sm`}>
                <h2 className="text-xl font-bold mb-4">Document Verification Status</h2>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{progress}%</span>
                  </div>
                  <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-6">                  {userProfile?.documents.map((doc, index) => (
                  <div key={doc.id} className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{doc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(doc.status, darkMode)}`}>
                          {doc.status}
                        </span>

                        {doc.status === 'REQUIRES_REUPLOAD' && (
                          <button
                            onClick={() => handleReuploadClick(doc.id, doc.type)}
                            className="ml-3 text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Reupload
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                  {(!userProfile?.documents || userProfile.documents.length === 0) && (
                    <div className="text-center py-6">
                      {/* Check if user has SCUML license instead of documents */}
                      {hasSCUMLLicense() ? (
                        <div className="space-y-4">
                          <div className={`${darkMode ? 'bg-green-800/20 border-green-600/30' : 'bg-green-50 border-green-200'} border rounded-lg p-6`}>
                            <div className="flex items-center justify-center mb-4">
                              <div className={`${darkMode ? 'bg-green-700' : 'bg-green-100'} rounded-full p-3`}>
                                <Shield className={`h-8 w-8 ${darkMode ? 'text-green-300' : 'text-green-600'}`} />
                              </div>
                            </div>
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-green-300' : 'text-green-800'} mb-2`}>
                              SCUML License Verification
                            </h3>
                            <p className={`${darkMode ? 'text-green-200' : 'text-green-700'} mb-4`}>
                              Your account is verified through your Securities and Commodities Market License.
                            </p>
                            <div className={`${darkMode ? 'bg-green-900/30' : 'bg-white'} rounded-md p-4 border ${darkMode ? 'border-green-600/20' : 'border-green-100'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>License Number</p>
                                  <p className={`text-lg font-mono ${darkMode ? 'text-green-200' : 'text-green-900'}`}>
                                    {getSCUMLNumber()}
                                  </p>
                                </div>
                                <CheckCircle className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                              </div>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-green-300/70' : 'text-green-600'} mt-3`}>
                              No additional document uploads required for SCUML verified accounts.
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Show default no documents message for non-SCUML accounts
                        <>
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No documents uploaded yet.</p>
                          <Link
                            href="/user/upload-kyc-documents"
                            className={`mt-4 inline-flex items-center px-4 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                              } text-white font-medium rounded-lg transition-colors`}
                          >
                            Upload your documents
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Quick Actions */}
              <section className='mt-8'>
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 shadow-sm mb-8`}>
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                    <Link
                      href="/user/verification-status"
                      className={`flex items-center p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        } transition-colors`}
                    >
                      <Shield className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-3`} />
                      <div>
                        <p className="font-medium">View Verification Status</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Check your document verification progress</p>
                      </div>
                    </Link>

                    <Link
                      href="#support"
                      className={`flex items-center p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        } transition-colors`}
                    >
                      <Headphones className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-3`} />
                      <div>
                        <p className="font-medium">Contact Support</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get help with your verification</p>
                      </div>
                    </Link>

                    <Link
                      href="#faq"
                      className={`flex items-center p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        } transition-colors`}
                    >
                      <FileQuestion className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-3`} />
                      <div>
                        <p className="font-medium">FAQ</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>View commonly asked questions</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </section>

            </section>
          </div>

          {/* Right Column - Quick Actions and Support */}
          <div className="lg:col-span-1">

            {/* Verification Status Card */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm mb-8`}>
              <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-600'} p-6 text-center`}>
                <div className={`${darkMode ? 'bg-blue-800' : 'bg-blue-500'} h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {verificationStatus === 'APPROVED' ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <Clock className="h-6 w-6 text-white" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {verificationStatus === 'APPROVED' ? 'Verification Complete' : 'Verification in Progress'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {verificationStatus === 'APPROVED' ?
                    'Your identity has been verified successfully.' :
                    'Our team is currently reviewing your submitted documents.'}
                </p>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Verification Progress</span>
                  </div>
                  <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  {userProfile?.documents && userProfile.documents.length > 0 ? (
                    <Link
                      href="/user/verification-status"
                      className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium inline-flex items-center`}
                    >
                      View verification status <span className="ml-1">→</span>

                    </Link>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Link
                        href="/user/upload-kyc-documents"
                        className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium inline-flex items-center`}
                      >
                        Upload documents <span className="ml-1">→</span>
                      </Link>
                      <div className={`flex items-center gap-1`}>
                        <AlertCircle className={`h-3 w-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Documents can only be submitted once
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Credit Score Card (Gauge Style) */}
            <CreditScore darkMode={darkMode} />



            {/* Important Notices */}
            <div className={`${darkMode ? 'bg-amber-900' : 'bg-amber-50'} rounded-lg border ${darkMode ? 'border-amber-800' : 'border-amber-200'
              } p-6 mt-8`}>
              <div className="flex items-start">
                <Bell className={`h-5 w-5 ${darkMode ? 'text-amber-400' : 'text-amber-500'} mt-0.5 mr-3`} />
                <div>
                  <h3 className={`font-medium ${darkMode ? 'text-amber-100' : 'text-amber-800'}`}>Important Notice</h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                    Keep your profile information up to date to ensure a smooth verification process.
                  </p>
                </div>
              </div>            </div>
          </div>
        </div>
      </div>

      {/* Document Re-upload Modal */}
      <DocumentReuploadModal
        isOpen={isReuploadModalOpen}
        onClose={() => setIsReuploadModalOpen(false)}
        documentId={selectedDocumentId}
        documentType={selectedDocumentType}
        onSuccess={handleReuploadSuccess}
      />
    </div>
  );
};

export default UserDashboard;


