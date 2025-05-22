'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle } from 'lucide-react';

const VerificationStatusPage = () => {
  const router = useRouter();
  const [progress, setProgress] = useState(65);
  const [isVerified, setIsVerified] = useState(false);
  
  // Simulate verification progress
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
      setIsVerified(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleContinue = () => {
    router.push('/user/dashboard');
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="p-8">
        <div className="bg-blue-600 rounded-lg p-6 mb-6 shadow-md border border-blue-700">
          <div className="text-center mb-6">
            <div className="bg-blue-500 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification in Progress</h2>
            <p className="text-blue-100">
              Our team is currently reviewing your submitted documents.
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-blue-100 mb-2">
              <span>Verification Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-4 text-white">
            <div className="flex items-start">
              <div className="mt-0.5 mr-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium">Documents Received</p>
                <p className="text-blue-200 text-sm">All required documents have been uploaded</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-0.5 mr-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium">Initial Document Verification</p>
                <p className="text-blue-200 text-sm">Document format check complete</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-0.5 mr-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium">Video selfie Verification</p>
                <p className="text-blue-200 text-sm">Verifying your identity information</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-0.5 mr-3">
                {isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-300" />
                )}
              </div>
              <div>
                <p className="font-medium">Final Approval</p>
                <p className="text-blue-200 text-sm">
                  {isVerified ? 'Verification complete' : 'Awaiting final verification'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {isVerified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">
                  Congratulations! Your identity has been successfully verified.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleContinue}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          disabled={!isVerified}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

export default VerificationStatusPage;