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
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                  {feature.icon}
                  <span className="text-sm font-medium text-slate-700">{feature.text}</span>
                </div>
              ))}
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