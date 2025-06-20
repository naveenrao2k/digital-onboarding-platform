'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Video, Check, ArrowLeft, ArrowRight, CheckCircle, Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { uploadSelfieVerification, getVerificationStatus } from '@/lib/file-upload-service';
import { useVerificationStore } from '@/lib/verification-store';
import StepCompletionMessage from '@/components/StepCompletionMessage';
import { VerificationStatusEnum } from '@/app/generated/prisma';

const SelfieVerificationPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { selfieStatus, fetchVerificationStatus } = useVerificationStore();
  const [step, setStep] = useState('instructions'); // instructions, camera, verifying, completed
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [useAutomaticCapture, setUseAutomaticCapture] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/access');
    } else if (user && !hasCheckedStatus) {
      setHasCheckedStatus(true);
      fetchVerificationStatus(user.id);
    }
  }, [user, loading, router, hasCheckedStatus, fetchVerificationStatus]);
  
  // Check for completed selfie verification
  const isSelfieVerificationComplete = selfieStatus === VerificationStatusEnum.APPROVED;

  // If selfie verification is already complete, show completion message
  if (isSelfieVerificationComplete) {
    return (
      <StepCompletionMessage
        title="Selfie Verification Complete"
        message="You have already completed the selfie verification step. Your identity has been verified."
        backUrl="/user/verification-status"
        backButtonText="View Verification Status"
      />
    );
  }
  
  // Handle camera setup and cleanup
  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [step]);
  
  // Sequence of instructions for the user when using automatic capture
  useEffect(() => {
    if (step !== 'camera' || !useAutomaticCapture) return;
    
    const instructions = [
      { text: 'Look straight at the camera', duration: 3000 },
      { text: 'Slowly turn your head to the left', duration: 3000 },
      { text: 'Now turn your head to the right', duration: 3000 },
      { text: 'Look straight again', duration: 3000 },
    ];
    
    let currentIndex = 0;
    setInstruction(instructions[currentIndex].text);
    
    const intervalId = setInterval(() => {
      currentIndex++;
      
      if (currentIndex < instructions.length) {
        setInstruction(instructions[currentIndex].text);
      } else {
        clearInterval(intervalId);
        // Capture and upload the selfie
        captureAndUploadSelfie();
      }
    }, instructions[currentIndex].duration);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [step, useAutomaticCapture]);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access your camera. Please ensure you have granted permission.');
      setStep('instructions');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const captureAndUploadSelfie = async () => {
    try {
      setError('');
      setIsUploading(true);
      
      // Use the existing canvas or create a new one
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;
      
      if (!video) {
        throw new Error('Video element not found');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert the canvas to a blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/jpeg', 0.8);
      });
      
      // Create a File object from the blob
      const selfieFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      
      // Set step to verifying to show the user we're processing
      setStep('verifying');
      
      // Upload the selfie via our API with progress tracking
      const result = await uploadSelfieVerification(selfieFile, (progress) => {
        setUploadProgress(progress);
      });
      
      // Check if liveness check information is included in the response
      if (result.livenessCheck) {
        console.log('Liveness check results:', result.livenessCheck);
      }
      
      // Continue with verification flow
      setTimeout(() => {
        setStep('completed');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error capturing or uploading selfie:', err);
      
      // Set specific error message based on error type
      if (err.message.includes('No face detected')) {
        setError('No face was detected in the image. Please ensure your face is clearly visible and try again.');
      } else if (err.message.includes('Multiple faces detected')) {
        setError('Multiple faces were detected. Please ensure only your face is in the frame and try again.');
      } else if (err.message.includes('Liveness check failed')) {
        setError('Liveness check failed. Please ensure you are in a well-lit area and your face is clearly visible. The system needs to verify that you are a real person and not a photo or video.');
      } else {
        setError(err.message || 'Failed to capture or upload selfie');
      }
      
      setStep('error'); // Go to error step
    } finally {
      setIsUploading(false);
    }
  };
  
  const startVerification = () => {
    setStep('camera');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleContinue = async () => {
    try {
      // Save verification status to localStorage for UI state persistence
      localStorage.setItem('selfieVerification', JSON.stringify({
        completed: true,
        timestamp: new Date().toISOString()
      }));
      
      // Fetch the updated verification status to ensure it's properly synced
      await getVerificationStatus();
      
      // Navigate to verification status page
      router.push('/user/verification-status');
    } catch (err) {
      console.error('Error updating verification status:', err);
      // Still navigate even if there's an error fetching the status
      router.push('/user/verification-status');
    }
  };
  
  return (
    <div className="max-w-md mx-auto rounded-xl shadow-md border my-10 bg-gray-50">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-2">Video Selfie Verification</h2>
        <p className="text-gray-600 mb-6">
          Please complete a quick video verification to confirm your identity
        </p>
        
        {step === 'instructions' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <AlertCircle className="text-amber-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-700">Important</p>
                  <p className="text-amber-700">
                    Ensure you are in a well-lit area with your face clearly visible. Good lighting is critical for successful verification. Our system will verify that you are a real person (liveness check) and match your face to your ID documents.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-600 rounded-lg p-12 mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-blue-400 bg-opacity-30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <p className="text-white text-xl font-medium">Video Selfie Instructions</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-gray-700">Ensure your face is clearly visible in good lighting</p>
              </div>
              
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-gray-700">Follow the on-screen directions to turn your head</p>
              </div>
              
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-gray-700">Keep your face within the frame at all times</p>
              </div>
              
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-gray-700">The process will take about 15 seconds</p>
              </div>
              
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-gray-700">Avoid using photos or videos - our system verifies your liveness</p>
              </div>
            </div>
            
            <button
              onClick={startVerification}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Start Verification <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </>
        )}
        
        {step === 'camera' && (
          <div className="mb-8">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-100 rounded-lg object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-full opacity-50"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white p-3 text-center rounded-b-lg">
                {isUploading ? `Uploading... ${uploadProgress}%` : instruction || 'Position your face in the center'}
              </div>
            </div>
            
            {!useAutomaticCapture && (
              <button
                onClick={captureAndUploadSelfie}
                disabled={isUploading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mt-4 flex items-center justify-center disabled:bg-blue-400"
              >
                <Camera className="mr-2 h-4 w-4" /> 
                {isUploading ? 'Capturing...' : 'Capture Image'}
              </button>
            )}
            
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="captureMode"
                  checked={useAutomaticCapture}
                  onChange={(e) => setUseAutomaticCapture(e.target.checked)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="captureMode" className="text-gray-700 text-sm">
                  Automatic capture (follows instructions)
                </label>
              </div>
            </div>
          </div>
        )}
        
        {step === 'error' && (
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Verification Error</p>
                  <p className="text-red-700">
                    {error || "There was an error processing your verification. Please try again."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('camera')}
                className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => setStep('instructions')}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Back to Instructions
              </button>
            </div>
          </>
        )}
        
        {step === 'verifying' && (
          <div className="text-center py-12 mb-8">
            <div className="mb-4">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-800 mb-2">Processing your verification...</p>
            <p className="text-gray-600">We're analyzing your selfie verification</p>
            <div className="max-w-xs mx-auto mt-4">
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-gray-500">This may take up to 15 seconds</p>
            </div>
          </div>
        )}
        
        {step === 'completed' && (
          <>
            <div className="bg-green-600 rounded-lg p-12 mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-green-400 bg-opacity-30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-white text-xl font-medium">Your selfie has been submitted!</p>
                <p className="text-green-100 mt-2">
                  Your identity verification is now being processed
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
              <h3 className="font-medium text-gray-800 mb-2">What happens next?</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                    <span className="text-xs text-blue-600 font-medium">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Our system will automatically verify your selfie against your submitted ID documents
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                    <span className="text-xs text-blue-600 font-medium">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You'll receive a notification once verification is complete (typically within 24-48 hours)
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                    <span className="text-xs text-blue-600 font-medium">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can check your verification status anytime from your dashboard
                  </p>
                </li>
              </ul>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Verification Status
            </button>
          </>
        )}
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Why we need this</h3>
          <p className="text-gray-600 mb-4">
            This video selfie helps us verify that you're a real person and matches your ID documents. The head movement helps prevent fraud and ensures the verification is being completed by you in real-time.
          </p>
          
          {step === 'instructions' && (
            <button
              onClick={handleBack}
              className="py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfieVerificationPage;