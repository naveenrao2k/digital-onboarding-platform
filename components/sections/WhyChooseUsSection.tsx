import React from 'react';
import { Check } from 'lucide-react';

interface ReasonProps {
  title: string;
  description: string;
}

const Reason: React.FC<ReasonProps> = ({ title, description }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mt-1">
      <div className="rounded-full bg-blue-100 p-1">
        <Check className="h-4 w-4 text-blue-600" />
      </div>
    </div>
    <div className="ml-3">
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-1 text-slate-600">{description}</p>
    </div>
  </div>
);

const WhyChooseUsSection: React.FC = () => {
  const reasons = [
    {
      title: "Simple and Intuitive Interface",
      description: "Designed with both users and administrators in mind, our platform offers an intuitive experience for all stakeholders."
    },
    {
      title: "Manual Verification Flexibility",
      description: "Our human-in-the-loop approach gives you complete control over the verification process and final decisions."
    },
    {
      title: "Modern and Scalable Technology",
      description: "Built using cutting-edge tech stack that scales seamlessly with your business growth and user base."
    },
    {
      title: "Secure Storage and Audit Logs",
      description: "Enterprise-grade security for document storage with comprehensive audit logs for compliance purposes."
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Why Choose Our KYC Solution
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Our platform combines the best of human expertise and modern technology to deliver a verification system you can trust.
            </p>
            
            <div className="mt-10 space-y-6">
              {reasons.map((reason, index) => (
                <Reason
                  key={index}
                  title={reason.title}
                  description={reason.description}
                />
              ))}
            </div>
          </div>
          
          <div className="lg:pl-10">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="aspect-w-16 aspect-h-9 mb-6 bg-slate-100 rounded-lg overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/6804602/pexels-photo-6804602.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="KYC Verification Process" 
                    className="object-cover"
                  />
                </div>
                
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Industry-Leading Compliance Standards
                </h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <span className="ml-2 text-slate-700">GDPR Compliant Data Handling</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <span className="ml-2 text-slate-700">AML Regulation Support</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <span className="ml-2 text-slate-700">KYC Best Practices Implementation</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <span className="ml-2 text-slate-700">Secure Document Storage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;