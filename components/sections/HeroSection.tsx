'use client';

import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle, Lock, UserCheck, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const HeroSection: React.FC = () => {
  const { accessWithId, loading } = useAuth();
  const router = useRouter();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const features = [
    { icon: <Lock className="h-5 w-5 text-blue-600" />, text: "Bank-Grade Security" },
    { icon: <UserCheck className="h-5 w-5 text-blue-600" />, text: "Manual ID Verification" },
    { icon: <FileCheck className="h-5 w-5 text-blue-600" />, text: "AML Compliant" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!id.trim()) {
      setError('ID is required');
      setIsLoading(false);
      return;
    }
    
    try {
      await accessWithId(id, name, phoneNumber);
      // Redirection is handled in the accessWithId function
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 opacity-70">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjYjJiN2ZmIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-[0.15]"></div>
        </div>
      </div>

      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-100"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse mr-2"></span>
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Trusted by 500+ Companies
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-8 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              <span className="text-slate-900">Verify Identities with</span>
              <br />
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Complete Confidence
                </span>
                <svg className="absolute top-full left-0 w-full h-2 mt-1" viewBox="0 0 200 4">
                  <path
                    d="M 0 2 Q 50 4 100 2 Q 150 0 200 2"
                    stroke="url(#blue-gradient)"
                    fill="none"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="blue-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg text-slate-600 max-w-lg mx-auto lg:mx-0"
            >
              Transform your KYC process with our secure, compliant, and human-powered identity verification platform — trusted by leading financial institutions worldwide.
            </motion.p>            <motion.div
              variants={itemVariants}
              className="mt-8"
            >
              {/* ID-Based Entry Form */}
              <form 
                onSubmit={handleSubmit} 
                className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg max-w-lg mx-auto lg:mx-0"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Enter System With ID</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="id" className="block text-sm font-medium text-slate-700 mb-1">
                      ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="id"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder="Enter your unique ID"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Access System
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </span>
                    )}
                  </button>
                </div>
                
                <p className="mt-4 text-xs text-slate-500 text-center">
                  By accessing the system, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="mt-12 max-w-md mx-auto lg:mx-0"
            >
              <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-md space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    ID
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="mt-1 block w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your phone number"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          strokeOpacity=".5"
                          strokeWidth="2"
                          className="text-blue-300"
                        />
                        <path
                          d="M4 12h16"
                          strokeWidth="2"
                          className="text-blue-600"
                        />
                      </svg>
                    ) : (
                      'Access ID'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

          </div>

          <motion.div 
                variants={itemVariants}
                className="w-full h-full relative"
              >
                <div className="relative">
                  <img 
                    src="/assets/heroBanner.png" 
                    alt="KYC Verification Banner"
                    className="w-[150%] h-auto mx-auto transform scale-125"
                  />
                </div>
              </motion.div>
         
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;