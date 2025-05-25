'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface StepCompletionMessageProps {
  title: string;
  message: string;
  backUrl: string;
  backButtonText?: string;
}

const StepCompletionMessage = ({ 
  title, 
  message, 
  backUrl,
  backButtonText = 'Go Back'
}: StepCompletionMessageProps) => {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto rounded-xl shadow-md overflow-hidden border">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          <button
            onClick={() => router.push(backUrl)}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {backButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepCompletionMessage;
