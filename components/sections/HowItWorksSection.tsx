import React from 'react';
import { Upload, Search, CheckCircle } from 'lucide-react';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

const Step: React.FC<StepProps> = ({ number, title, description, icon, isLast = false }) => (
  <div className="flex flex-col md:flex-row items-center">
    <div className="flex-shrink-0 relative">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold">
        {number}
      </div>
      {!isLast && (
        <div className="absolute top-16 bottom-0 left-1/2 w-0.5 bg-blue-200 transform -translate-x-1/2 h-full md:h-32"></div>
      )}
    </div>
    
    <div className="mt-6 md:mt-0 md:ml-8 text-center md:text-left">
      <div className="mb-2 flex flex-col md:flex-row items-center md:items-start gap-2">
        <div className="rounded-full bg-blue-100 p-2">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-600 max-w-md">{description}</p>
    </div>
  </div>
);

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: "User Uploads Documents & Selfie",
      description: "Users submit their identity documents and a selfie through our secure, easy-to-use interface.",
      icon: <Upload className="h-5 w-5 text-blue-600" />
    },
    {
      number: 2,
      title: "Admin Reviews Submission",
      description: "Your team reviews the documents and compares the selfie with the ID photo for identity verification.",
      icon: <Search className="h-5 w-5 text-blue-600" />
    },
    {
      number: 3,
      title: "Approve or Reject Application",
      description: "Based on the review, admins can approve valid applications or reject suspicious ones with detailed notes.",
      icon: <CheckCircle className="h-5 w-5 text-blue-600" />
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Our streamlined verification process is designed for efficiency and accuracy
          </p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-16 md:space-y-24 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <Step
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;