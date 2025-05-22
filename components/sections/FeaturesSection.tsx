import React from 'react';
import { FileText, Camera, Users, Smartphone, Flag, ClipboardList } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-100">
    <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: "Document Upload",
      description: "Support for National ID, Passport, Utility Bills, and more with secure storage and handling."
    },
    {
      icon: <Camera className="h-6 w-6 text-blue-600" />,
      title: "Selfie Upload",
      description: "Easy selfie capture for face matching with submitted identity documents."
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Manual Review",
      description: "Expert admin panel for human verification of submitted documents and selfies."
    },
    
    {
      icon: <Flag className="h-6 w-6 text-blue-600" />,
      title: "Fraud Detection",
      description: "Easily flag suspicious entries and potential identity fraud cases."
    },
    
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Everything You Need for KYC Compliance
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Our platform provides all the tools necessary for thorough identity verification while keeping the experience simple for both users and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;