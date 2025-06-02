'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  FileText, 
  Camera, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useHeader } from '../../layout';
import { VerificationStatusEnum } from '@/app/generated/prisma';

interface RejectedSubmission {
  id: string;
  userId: string;
  userName: string;
  documentType: string;
  dateSubmitted: string;
  rejectedAt: string;
  rejectedBy: string;
  fileName: string;
  rejectionReason: string;
}

const AdminRejectedSubmissionsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rejectedSubmissions, setRejectedSubmissions] = useState<RejectedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const { updateHeader } = useHeader();

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // Redirect non-admin users
        // router.push('/user/dashboard');
      } else {
        // Fetch rejected submissions data
        fetchRejectedSubmissions();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    updateHeader('Rejected Submissions', 'View and manage all rejected document submissions');
  }, [updateHeader]);

  const fetchRejectedSubmissions = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch this data from API
      // For demo purposes, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock rejected submissions data
      setRejectedSubmissions([
        {
          id: 'doc_7',
          userId: 'user_7',
          userName: 'Robert Wilson',
          documentType: 'ID Card',
          dateSubmitted: '2025-05-18',
          rejectedAt: '2025-05-19 13:45:22',
          rejectedBy: 'Admin User',
          fileName: 'id_card.jpg',
          rejectionReason: 'Document is expired'
        },
        {
          id: 'doc_9',
          userId: 'user_9',
          userName: 'Thomas Moore',
          documentType: 'Selfie Verification',
          dateSubmitted: '2025-05-16',
          rejectedAt: '2025-05-17 10:30:15',
          rejectedBy: 'Admin Manager',
          fileName: 'selfie.jpg',
          rejectionReason: 'Face not clearly visible'
        },
        {
          id: 'doc_18',
          userId: 'user_18',
          userName: 'Christopher Lee',
          documentType: 'Passport',
          dateSubmitted: '2025-05-15',
          rejectedAt: '2025-05-16 14:20:33',
          rejectedBy: 'Admin User',
          fileName: 'passport.jpg',
          rejectionReason: 'Information does not match user profile'
        },
        {
          id: 'doc_19',
          userId: 'user_19',
          userName: 'Amanda Clark',
          documentType: 'Utility Bill',
          dateSubmitted: '2025-05-14',
          rejectedAt: '2025-05-15 09:15:40',
          rejectedBy: 'Admin Manager',
          fileName: 'utility_bill.pdf',
          rejectionReason: 'Document is more than 3 months old'
        },
        {
          id: 'doc_20',
          userId: 'user_20',
          userName: 'Brian Walker',
          documentType: 'Certificate of Incorporation',
          dateSubmitted: '2025-05-13',
          rejectedAt: '2025-05-14 16:50:12',
          rejectedBy: 'Admin User',
          fileName: 'certificate.pdf',
          rejectionReason: 'Document appears to be tampered with'
        },
      ]);
    } catch (err) {
      console.error('Error fetching rejected submissions:', err);
      setError('Failed to load rejected submissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter submissions based on search query (in production, you'd typically do this server-side)
    console.log('Searching for:', searchQuery);
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDownload = (submissionId: string, fileName: string) => {
    // In a real implementation, you would download the file
    console.log('Downloading file:', fileName, 'for submission:', submissionId);
  };

  const handleRequestResubmission = async (submissionId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Requesting resubmission for document:', submissionId);
      
      // Show success notification (in a real app)
      alert('Resubmission request sent to user');
    } catch (err) {
      console.error('Error requesting resubmission:', err);
      // Show error notification
    }
  };

  // Filter submissions based on filters
  const filteredSubmissions = rejectedSubmissions.filter(submission => {
    // Document type filter
    if (documentTypeFilter !== 'all' && submission.documentType !== documentTypeFilter) {
      return false;
    }
    
    // Search query filter (case insensitive)
    if (searchQuery && !(
      submission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.rejectionReason.toLowerCase().includes(searchQuery.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(rejectedSubmissions.map(s => s.documentType)));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading rejected submissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
    
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, document type or reason"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700">Document:</label>
                <div className="relative">
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => setDocumentTypeFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {documentTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
              
              <button 
                onClick={() => fetchRejectedSubmissions()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Rejected Submissions Table */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading rejected submissions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="mt-2 text-gray-800 font-medium">{error}</p>
            <button
              onClick={() => fetchRejectedSubmissions()}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No rejected submissions match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Reason</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected By</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
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
                        <div>
                          <div>{submission.documentType}</div>
                          <div className="text-sm text-gray-500">{submission.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{submission.rejectionReason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.rejectedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        {submission.rejectedAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(submission.userId)}
                          className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded" 
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(submission.id, submission.fileName)}
                          className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRequestResubmission(submission.id)}
                          className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded"
                          title="Request Resubmission"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRejectedSubmissionsPage;