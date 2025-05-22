'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, toggleOpen }) => (
  <div className="border-b border-slate-200 py-5">
    <button
      className="flex justify-between items-center w-full text-left focus:outline-none"
      onClick={toggleOpen}
      aria-expanded={isOpen}
    >
      <h3 className="text-lg font-medium text-slate-900">{question}</h3>
      <span className="ml-6 flex-shrink-0">
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-blue-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </span>
    </button>
    {isOpen && (
      <div className="mt-3 pr-12">
        <p className="text-slate-600">{answer}</p>
      </div>
    )}
  </div>
);

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is the selfie matched automatically?",
      answer: "No, our solution focuses on manual verification. This means a human reviewer will compare the selfie with the ID photo to ensure accurate identity matching. This approach provides higher accuracy and better fraud detection compared to fully automated systems."
    },
    {
      question: "What document types are supported?",
      answer: "Our platform supports a wide range of identity documents including National ID cards, Passports, Driver's Licenses, Utility Bills, Voter's Cards, and Bank Verification Numbers (BVN). We can also add support for additional document types based on your specific requirements."
    },
    {
      question: "How secure is the document storage?",
      answer: "We use Supabase's secure storage system with strict access controls. All documents are encrypted at rest and in transit. Additionally, we implement role-based access controls to ensure that only authorized personnel can access sensitive information."
    },
    {
      question: "Can we customize the verification workflow?",
      answer: "Yes, our platform is designed to be flexible. You can customize the verification steps, required documents, review process, and approval criteria to match your specific business needs and compliance requirements."
    },
    {
      question: "How long does the verification process take?",
      answer: "The end-to-end process typically takes 1-3 business days, depending on your team's capacity and the volume of applications. The actual manual review process usually takes only a few minutes per application when performed by trained staff."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            Get answers to common questions about our KYC verification platform
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              toggleOpen={() => toggleFaq(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;