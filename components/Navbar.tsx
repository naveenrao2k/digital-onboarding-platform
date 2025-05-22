"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-slate-900">KYCVerify</span>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-slate-700 hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-700 hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#tech-stack" className="text-slate-700 hover:text-blue-600 transition-colors">Technology</a>
            <a href="#faq" className="text-slate-700 hover:text-blue-600 transition-colors">FAQ</a>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <a href="#contact" className="px-4 py-2 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors">
              Login
            </a>
            <a href="#cta" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Request Demo
            </a>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 hover:text-blue-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t mt-2 py-2">
          <div className="px-2 space-y-1">
            <a 
              href="#features" 
              className="block px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="block px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#tech-stack" 
              className="block px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Technology
            </a>
            <a 
              href="#faq" 
              className="block px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </a>
            <div className="pt-4 flex flex-col space-y-2">
              <a 
                href="#contact" 
                className="px-4 py-2 rounded-md text-blue-600 border border-blue-600 text-center"
                onClick={() => setIsOpen(false)}
              >
                Login
              </a>
              <a 
                href="#cta" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-center"
                onClick={() => setIsOpen(false)}
              >
                Request Demo
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;