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
  Flag
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { VerificationStatusEnum } from '@/app/generated/prisma';

interface FlaggedSubmission {
  id: string;
  userId: string;
  userName: string;
  documentType: string;
  dateSubmitted: string;
  status: VerificationStatusEnum;
  fileName: string;
  flagReason: string;
  flaggedAt: string;
  flaggedBy: string;
}

const AdminFlaggedSubmissionsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [flaggedSubmissions, setFlaggedSubmissions] = useState<FlaggedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // Redirect non-admin users
        // router.push('/user/dashboard');
      } else {
        // Fetch flagged submissions data
        fetchFlaggedSubmissions();
      }
    }
  }, [user, loading, router]);

  const fetchFlaggedSubmissions = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch this data from API
      // For demo purposes, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock flagged submissions data
      setFlaggedSubmissions([
        {
          id: 'doc_11',
          userId: 'user_11',
          userName: 'Alex Thompson',
          documentType: 'Passport',
          dateSubmitted: '2025-05-21',
          status: 'IN_PROGRESS',
          fileName: 'passport.jpg',
          flagReason: 'Possible document tampering',
          flaggedAt: '2025-05-22 10:15:30',
          flaggedBy: 'System'
        },
        {
          id: 'doc_12',
          userId: 'user_12',
          userName: 'Jessica Parker',
          documentType: 'ID Card',
          dateSubmitted: '2025-05-20',
          status: 'IN_PROGRESS',
          fileName: 'id_card.jpg',
          flagReason: 'Information mismatch with existing records',
          flaggedAt: '2025-05-21 14:22:45',
          flaggedBy: 'Admin User'
        },
        {
          id: 'doc_13',
          userId: 'user_13',
          userName: 'Daniel Wilson',
          documentType: 'Utility Bill',
          dateSubmitted: '2025-05-19',
          status: 'IN_PROGRESS',
          fileName: 'utility_bill.pdf',
          flagReason: 'Document expired',
          flaggedAt: '2025-05-20 09:30:15',
          flaggedBy: 'System'
        },
        {
          id: 'doc_14',
          userId: 'user_14',
          userName: 'Olivia Martinez',
          documentType: 'Selfie Verification',
          dateSubmitted: '2025-05-18',
          status: 'IN_PROGRESS',
          fileName: 'selfie.jpg',
          flagReason: 'Face not matching ID document',
          flaggedAt: '2025-05-19 11:45:22',
          flaggedBy: 'Admin Manager'
        },
        {
          id: 'doc_15',
          userId: 'user_15',
          userName: 'William Johnson',
          documentType: 'Certificate of Incorporation',
          dateSubmitted: '2025-05-17',
          status: 'IN_PROGRESS',
          fileName: 'certificate.pdf',
          flagReason: 'Suspicious business activity',
          flaggedAt: '2025-05-18 15:10:05',
          flaggedBy: 'Admin User'
        },
      ]);
    } catch (err) {
      console.error('Error fetching flagged submissions:', err);
      setError('Failed to load flagged submissions. Please try again.');
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

  const handleApprove = async (submissionId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Approving flagged document:', submissionId);
      
      // Update submissions - remove the approved one
      setFlaggedSubmissions(prevSubmissions => 
        prevSubmissions.filter(submission => submission.id !== submissionId)
      );
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error approving document:', err);
      // Show error notification
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Rejecting flagged document:', submissionId);
      
      // Update submissions - remove the rejected one
      setFlaggedSubmissions(prevSubmissions => 
        prevSubmissions.filter(submission => submission.id !== submissionId)
      );
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error rejecting document:', err);
      // Show error notification
    }
  };

  const handleRemoveFlag = async (submissionId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Removing flag from document:', submissionId);
      
      // Update submissions - remove the unflagged one
      setFlaggedSubmissions(prevSubmissions => 
        prevSubmissions.filter(submission => submission.id !== submissionId)
      );
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error removing flag:', err);
      // Show error notification
    }
  };

  // Filter submissions based on filters
  const filteredSubmissions = flaggedSubmissions.filter(submission => {
    // Document type filter
    if (documentTypeFilter !== 'all' && submission.documentType !== documentTypeFilter) {
      return false;
    }
    
    // Search query filter (case insensitive)
    if (searchQuery && !(
      submission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.flagReason.toLowerCase().includes(searchQuery.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(flaggedSubmissions.map(s => s.documentType)));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading flagged submissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Flagged Submissions</h1>
        <p className="text-gray-600">Review submissions that require special attention</p>
      </div>
      
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
                onClick={() => fetchFlaggedSubmissions()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Flagged Submissions Table */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading flagged submissions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="mt-2 text-gray-800 font-medium">{error}</p>
            <button
              onClick={() => fetchFlaggedSubmissions()}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No flagged submissions match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Reason</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged By</th>
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
                        <Flag className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{submission.flagReason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.flaggedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.dateSubmitted}
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
                          onClick={() => handleApprove(submission.id)}
                          className="p-1 bg-green-100 hover:bg-green-200 text-green-800 rounded"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          className="p-1 bg-red-100 hover:bg-red-200 text-red-800 rounded"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
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

export default AdminFlaggedSubmissionsPage;