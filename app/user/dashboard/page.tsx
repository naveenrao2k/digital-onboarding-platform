'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Headphones,
  FileQuestion,
  Shield,
  Bell,
  Moon,
  Sun,
  LogOut,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVerificationStore } from '@/lib/verification-store';
import { VerificationStatusEnum } from '@/app/generated/prisma';

interface UserDocument {
  type: string;
  fileName: string;
  uploadedAt: string;
  status: VerificationStatusEnum | string;
}

const UserDashboard = () => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('Good afternoon');
  const [darkMode, setDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: '',
    phone: '',
    address: ''
  });
  
  // Use the verification store for state management
  const { 
    overallStatus: verificationStatus, 
    progress, 
    documents, 
    isLoading: isLoadingVerification,
    error: verificationError,
    fetchVerificationStatus,
    resetError
  } = useVerificationStore();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/access');
    } else if (user) {
      setUserName(user.firstName || 'User'); // Provide a default value if firstName is undefined
      setUserProfile(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
    
  }, [user, loading, router]);
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);
    // Fetch verification status
  useEffect(() => {
    if (!user) return;
      // Fetch verification status from our store
    fetchVerificationStatus(user.id);
    
    // Get user profile data if available
    if (user.phone) {
      setUserProfile(prev => ({ ...prev, phone: user.phone || '' }));
    }
    
    if (user.address) {
      setUserProfile(prev => ({ ...prev, address: user.address || '' }));
    }
    
  }, [user, fetchVerificationStatus]);
    
  // Format document type for display
  const formatDocumentType = (type: string): string => {
    return type
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
    
  // Check for saved dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  // If still loading, show a simple loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
       {/* Header with logo and user profile */}
       <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b py-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-2" />
              <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>KYC Verify</span>
            </div>
            <div className="flex items-center">
              <button 
                className={`mr-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                onClick={() => {
                  setDarkMode(!darkMode);
                  localStorage.setItem('darkMode', (!darkMode).toString());
                }}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button className="mr-4 text-gray-600 relative">
                <Bell className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">1</span>
              </button>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=4F46E5&color=fff`} alt="User" className="h-full w-full object-cover" />
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=4F46E5&color=fff`} alt="User" className="h-full w-full object-cover" />
              </div>
              <button 
                onClick={handleSignOut}
                className="ml-4 flex items-center text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Greeting section */}
            <section className="mb-8">
              <h1 className="text-2xl font-bold mb-1">{greeting}, {userName}</h1>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Here's what's happening with your account today.</p>
            </section>
            
            {/* Verification status alert */}
            {verificationStatus !== 'APPROVED' && (
              <section className="mb-8">
                <div className={`${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border rounded-lg p-4`}>
                  <div className="flex items-start">
                    <AlertCircle className="text-amber-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <p className={`font-medium ${darkMode ? 'text-amber-400' : 'text-amber-800'} mb-2 sm:mb-0`}>
                          Identity Verification Status: {verificationStatus === 'PENDING' ? 'Pending' : verificationStatus === 'IN_PROGRESS' ? 'In Progress' : 'Rejected'}
                        </p>
                        <Link 
                          href="/user/verification-status" 
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 inline-block text-center"
                        >
                          Take Action
                        </Link>
                      </div>
                      <p className={darkMode ? 'text-amber-400/80' : 'text-amber-700'}>
                        {verificationStatus === 'PENDING' ? 'Your documents need to be submitted' : 
                         verificationStatus === 'IN_PROGRESS' ? 'Your documents are being reviewed' :
                         'Your verification was rejected. Please contact support.'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Account overview */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Account Overview</h2>
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 mb-6 shadow-sm`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Email Address</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Phone Number</p>
                      <p className="font-medium">{userProfile.phone || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start md:col-span-2">
                    <MapPin className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Address</p>
                      <p className="font-medium">{userProfile.address || "Address not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Document status */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Document Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className={`${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-800'} p-4 rounded-lg shadow-sm`}>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>
                    {verificationStatus === 'APPROVED' ? documents.length : 0}
                  </div>
                  <div className="text-sm">Approved</div>
                </div>
                
                <div className={`${darkMode ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-800'} p-4 rounded-lg shadow-sm`}>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'} mb-1`}>
                    {verificationStatus === 'IN_PROGRESS' ? documents.length : 0}
                  </div>
                  <div className="text-sm">Pending</div>
                </div>
                
                <div className={`${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-800'} p-4 rounded-lg shadow-sm`}>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'} mb-1`}>
                    {verificationStatus === 'REJECTED' ? documents.length : 0}
                  </div>
                  <div className="text-sm">Rejected</div>
                </div>
              </div>
              
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm`}>
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <div key={index} className={`p-4 flex items-start ${index !== documents.length - 1 ? (darkMode ? 'border-gray-700' : 'border-gray-200') + ' border-b' : ''}`}>
                      <div className={`h-10 w-10 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                        <FileText className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{doc.type}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uploaded on {doc.uploadedAt}</p>
                          </div>
                          <span className={`px-3 py-1 ${getStatusBadgeColor(doc.status)} text-xs font-medium rounded-full flex items-center`}>
                            {doc.status === 'APPROVED' ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Pending</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No documents uploaded yet.</p>
                    <Link 
                      href="/user/upload-kyc-documents" 
                      className="mt-2 inline-block text-blue-600 hover:underline"
                    >
                      Upload your documents
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <Link 
                  href="/user/upload-kyc-documents" 
                  className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium inline-flex items-center`}
                >
                  {documents.length > 0 ? 'Manage documents' : 'Upload documents'} <span className="ml-1">→</span>
                </Link>
              </div>
            </section>
          </div>
          
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
                    <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{progress}%</span>
                  </div>
                  <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Documents Received</p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>All required documents have been uploaded</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Initial Document Verification</p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Document format check complete</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Video selfie Verification</p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Verifying your identity information</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    {progress >= 100 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5 mr-2 flex-shrink-0`} />
                    )}
                    <div>
                      <p className={`font-medium ${progress >= 100 ? '' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>Final Approval</p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                        {progress >= 100 ? 'Verification complete' : 'Awaiting final verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Need help section */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Need Help?</h2>
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 shadow-sm`}>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Headphones className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mt-0.5 mr-3`} />
                    <div>
                      <p className="font-medium mb-1">Contact Support</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Available Mon-Fri (9am - 5pm)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileQuestion className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mt-0.5 mr-3`} />
                    <div>
                      <p className="font-medium mb-1">Documentation</p>
                      <Link 
                        href="/user/guides" 
                        className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        View Verification Guides
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
  
  // Helper function to get badge color based on status
  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'APPROVED':
        return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
      case 'REJECTED':
        return darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
      default:
        return darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800';
    }
  }
};

export default UserDashboard;


