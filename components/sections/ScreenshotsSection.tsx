'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScreenshotProps {
  title: string;
  description: string;
  imageSrc: string;
  active: boolean;
}

const Screenshot: React.FC<ScreenshotProps> = ({ title, description, imageSrc, active }) => (
  <div 
    className={`transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 hidden'}`}
  >
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="h-8 bg-slate-100 flex items-center px-4 border-b">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
      </div>
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-[400px] object-cover object-top"
      />
    </div>
    <div className="mt-6 text-center">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  </div>
);

const ScreenshotsSection: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const screenshots = [
    {
      title: "User Upload Portal",
      description: "Intuitive interface for document and selfie uploads with clear instructions.",
      imageSrc: "https://images.pexels.com/photos/6804079/pexels-photo-6804079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      title: "KYC Submission Status",
      description: "Real-time status updates for users on their verification progress.",
      imageSrc: "https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      title: "Admin Review Panel",
      description: "Comprehensive dashboard for reviewing submissions and making verification decisions.",
      imageSrc: "https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      title: "Selfie & Document Comparison",
      description: "Side-by-side comparison tools for accurate identity verification.",
      imageSrc: "https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    }
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Product Screenshots
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            See how our intuitive interfaces make KYC verification simple and effective
          </p>
        </div>

        <div className="relative">
          <div className="max-w-4xl mx-auto">
            {screenshots.map((screenshot, index) => (
              <Screenshot
                key={index}
                title={screenshot.title}
                description={screenshot.description}
                imageSrc={screenshot.imageSrc}
                active={index === activeSlide}
              />
            ))}
          </div>
          
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-4 md:-translate-x-8">
            <button 
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-blue-600 focus:outline-none"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 md:translate-x-8">
            <button 
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-blue-600 focus:outline-none"
              aria-label="Next screenshot"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`w-2.5 h-2.5 rounded-full mx-1 ${
                index === activeSlide ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              aria-label={`Go to screenshot ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;