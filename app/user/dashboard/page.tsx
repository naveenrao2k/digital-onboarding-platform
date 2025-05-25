'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Phone, MapPin, FileText, AlertCircle, CheckCircle,
  Clock, Headphones, FileQuestion, Shield, Bell, Moon, Sun,
  LogOut, RefreshCw, Building, Building2, User
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVerificationStore } from '@/lib/verification-store';
import { VerificationStatusEnum, AccountType } from '@/app/generated/prisma';
import { fetchUserProfile, formatAccountType, getStatusBadgeColor } from '@/lib/profile-service';
import type { UserProfile } from '@/lib/profile-service';

const UserDashboard = () => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Good afternoon');
  const [darkMode, setDarkMode] = useState(false);

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
        const profile = await fetchUserProfile();
        setUserProfile(profile);
        
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
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-600'
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

                <div className="space-y-6">
                  {userProfile?.documents.map((doc, index) => (
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(doc.status, darkMode)}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!userProfile?.documents || userProfile.documents.length === 0) && (
                    <div className="text-center py-6">
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No documents uploaded yet.</p>
                      <Link 
                        href="/user/upload-kyc-documents"
                        className={`mt-4 inline-flex items-center px-4 py-2 ${
                          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-medium rounded-lg transition-colors`}
                      >
                        Upload your documents
                      </Link>
                    </div>
                  )}
                </div>
              </div>
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

            {/* Quick Actions */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 shadow-sm mb-8`}>
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-4">
                <Link 
                  href="/user/verification-status"
                  className={`flex items-center p-3 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
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
                  className={`flex items-center p-3 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
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
                  className={`flex items-center p-3 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
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

            {/* Important Notices */}
            <div className={`${darkMode ? 'bg-amber-900' : 'bg-amber-50'} rounded-lg border ${
              darkMode ? 'border-amber-800' : 'border-amber-200'
            } p-6`}>
              <div className="flex items-start">
                <Bell className={`h-5 w-5 ${darkMode ? 'text-amber-400' : 'text-amber-500'} mt-0.5 mr-3`} />
                <div>
                  <h3 className={`font-medium ${darkMode ? 'text-amber-100' : 'text-amber-800'}`}>Important Notice</h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                    Keep your profile information up to date to ensure a smooth verification process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;


