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
  Sun
} from 'lucide-react';
import Link from 'next/link';

const UserDashboard = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('John');
  const [greeting, setGreeting] = useState('Good afternoon');
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [darkMode, setDarkMode] = useState(false);

  // Set greeting based on time of day and get user preferences
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Get user data from localStorage if available
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const { firstName } = JSON.parse(userData);
        if (firstName) setUserName(firstName);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // Check verification status
    const selfieVerification = localStorage.getItem('selfieVerification');
    const kycDocuments = localStorage.getItem('kycDocuments');

    if (selfieVerification && kycDocuments) {
      // In a real app, this would check with the backend
      // For now, we'll simulate a pending status
      setVerificationStatus('pending');
    }

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

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
              </div>
            </div>
          </div>
        </div>
      </header>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:p-12 lg:px-20 px-0 p-4">
        <div className="lg:col-span-2">
          {/* Greeting section */}
          <section className="mb-8">
            <h1 className="text-2xl font-bold mb-1">{greeting}, {userName}</h1>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Here's what's happening with your account today.</p>
          </section>

          {/* Verification status alert */}
          <section className="mb-8">
            <div className={`${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border rounded-lg p-4`}>
              <div className="flex items-start">
                <AlertCircle className="text-amber-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <p className={`font-medium ${darkMode ? 'text-amber-400' : 'text-amber-800'} mb-2 sm:mb-0`}>
                      Identity Verification Status: Pending
                    </p>
                    <Link
                      href="/user/verification-status"
                      className="px-4 py-2 bg-gray-900 w-fit text-white text-sm font-medium rounded-lg hover:bg-gray-800 inline-block text-center"
                    >
                      Take Action
                    </Link>
                  </div>
                  <p className={darkMode ? 'text-amber-400/80' : 'text-amber-700'}>Your documents are being reviewed</p>
                </div>
              </div>
            </div>
          </section>

          {/* Account overview */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Account Overview</h2>
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 mb-6 shadow-sm`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Email Address</p>
                    <p className="font-medium">user@example.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Phone Number</p>
                    <p className="font-medium">+1 555-123-4567</p>
                  </div>
                </div>

                <div className="flex items-start md:col-span-2">
                  <MapPin className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 mr-3`} />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Address</p>
                    <p className="font-medium">123 Main St, New York, NY 10001</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Document status */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Document Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`${darkMode ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 'bg-green-50 text-green-800 border border-green-100'} p-4 rounded-lg shadow-sm`}>
                <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>1</div>
                <div className="text-sm">Approved</div>
              </div>

              <div className={`${darkMode ? 'bg-amber-900/20 text-amber-400 border border-amber-900/30' : 'bg-amber-50 text-amber-800 border border-amber-100'} p-4 rounded-lg shadow-sm`}>
                <div className={`text-3xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'} mb-1`}>1</div>
                <div className="text-sm">Pending</div>
              </div>

              <div className={`${darkMode ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-800 border border-red-100'} p-4 rounded-lg shadow-sm`}>
                <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'} mb-1`}>0</div>
                <div className="text-sm">Rejected</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm`}>
              <div className={`p-4 flex items-start ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <div className={`h-10 w-10 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                  <FileText className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">ID</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uploaded on 01/02/2023</p>
                    </div>
                    <span className={`px-3 py-1 ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'} text-xs font-medium rounded-full flex items-center`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approved
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-start">
                <div className={`h-10 w-10 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                  <FileText className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">UtilityBill</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uploaded on 03/02/2023</p>
                    </div>
                    <span className={`px-3 py-1 ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800'} text-xs font-medium rounded-full flex items-center`}>
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/user/documents"
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium inline-flex items-center`}
              >
                View all documents <span className="ml-1">→</span>
              </Link>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 lg:mt-[5.5rem]">
          {/* Verification Status Card */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-sm mb-8`}>
            <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-600'} p-6 text-center`}>
              <div className={`${darkMode ? 'bg-blue-800' : 'bg-blue-500'} h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Verification in Progress</h3>
              <p className="text-blue-100 text-sm">
                Our team is currently reviewing your submitted documents.
              </p>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Verification Progress</span>
                  <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>65%</span>
                </div>
                <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}
                    style={{ width: '65%' }}
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
                  <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5 mr-2 flex-shrink-0`} />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Final Approval</p>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Awaiting final verification</p>
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

    </div>



  );
};

export default UserDashboard;


