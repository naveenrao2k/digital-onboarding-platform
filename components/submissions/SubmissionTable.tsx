'use client';

import React from 'react';
import { FileText, Camera, AlertCircle, Eye, Download, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { VerificationStatusEnum } from '@/app/generated/prisma';

interface SubmissionTableProps {
  submissions: Array<{
    id: string;
    userId: string;
    userName: string;
    documentType: string;
    dateSubmitted: string;
    status: VerificationStatusEnum;
    fileName: string;
  }>;
  isLoading: boolean;
  error: string | null;
  onView: (submissionId: string) => void;
  onDownload: (submissionId: string) => void;
  onRetry?: () => void;
}

const SubmissionTable: React.FC<SubmissionTableProps> = ({
  submissions,
  isLoading,
  error,
  onView,
  onDownload,
  onRetry
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
        <p className="mt-2 text-gray-800 font-medium">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No submissions match your filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {submissions.map((submission) => (
            <tr key={submission.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-3">
                    {submission.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{submission.userName}</div>
                    <div className="text-sm text-gray-500">ID: {submission.userId}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {submission.documentType.includes('Selfie') ? (
                    <Camera className="h-4 w-4 text-gray-500 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  )}
                  <span>{submission.fileName}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{new Date(submission.dateSubmitted).toLocaleDateString()}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  submission.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
                  submission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  ''
                }`}>
                  {submission.status.charAt(0) + submission.status.slice(1).toLowerCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(submission.id)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDownload(submission.id)}
                    className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionTable;
