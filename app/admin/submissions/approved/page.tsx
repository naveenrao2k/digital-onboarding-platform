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
import { VerificationStatusEnum } from '@/app/generated/prisma';

interface ApprovedSubmission {
  id: string;
  userId: string;
  userName: string;
  documentType: string;
  dateSubmitted: string;
  approvedAt: string;
  approvedBy: string;
  fileName: string;
}

const AdminApprovedSubmissionsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [approvedSubmissions, setApprovedSubmissions] = useState<ApprovedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // Redirect non-admin users
        // router.push('/user/dashboard');
      } else {
        // Fetch approved submissions data
        fetchApprovedSubmissions();
      }
    }
  }, [user, loading, router]);

  const fetchApprovedSubmissions = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch this data from API
      // For demo purposes, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock approved submissions data
      setApprovedSubmissions([
        {
          id: 'doc_6',
          userId: 'user_6',
          userName: 'Lisa Anderson',
          documentType: 'Passport',
          dateSubmitted: '2025-05-19',
          approvedAt: '2025-05-20 14:30:22',
          approvedBy: 'Admin User',
          fileName: 'passport.jpg'
        },
        {
          id: 'doc_8',
          userId: 'user_8',
          userName: 'Jennifer Taylor',
          documentType: 'Utility Bill',
          dateSubmitted: '2025-05-17',
          approvedAt: '2025-05-18 11:15:45',
          approvedBy: 'Admin User',
          fileName: 'utility_bill.pdf'
        },
        {
          id: 'doc_10',
          userId: 'user_10',
          userName: 'Patricia Martin',
          documentType: 'Certificate of Incorporation',
          dateSubmitted: '2025-05-15',
          approvedAt: '2025-05-16 09:45:10',
          approvedBy: 'Admin Manager',
          fileName: 'certificate.pdf'
        },
        {
          id: 'doc_16',
          userId: 'user_16',
          userName: 'Richard Davis',
          documentType: 'ID Card',
          dateSubmitted: '2025-05-14',
          approvedAt: '2025-05-15 16:20:33',
          approvedBy: 'Admin User',
          fileName: 'id_card.jpg'
        },
        {
          id: 'doc_17',
          userId: 'user_17',
          userName: 'Michelle White',
          documentType: 'Selfie Verification',
          dateSubmitted: '2025-05-13',
          approvedAt: '2025-05-14 10:05:18',
          approvedBy: 'Admin Manager',
          fileName: 'selfie.jpg'
        },
      ]);
    } catch (err) {
      console.error('Error fetching approved submissions:', err);
      setError('Failed to load approved submissions. Please try again.');
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

  const handleRevoke = async (submissionId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Revoking approval for document:', submissionId);
      
      // Update submissions - remove the revoked one
      setApprovedSubmissions(prevSubmissions => 
        prevSubmissions.filter(submission => submission.id !== submissionId)
      );
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error revoking approval:', err);
      // Show error notification
    }
  };

  // Filter submissions based on filters
  const filteredSubmissions = approvedSubmissions.filter(submission => {
    // Document type filter
    if (documentTypeFilter !== 'all' && submission.documentType !== documentTypeFilter) {
      return false;
    }
    
    // Search query filter (case insensitive)
    if (searchQuery && !(
      submission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.approvedBy.toLowerCase().includes(searchQuery.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(approvedSubmissions.map(s => s.documentType)));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading approved submissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Approved Submissions</h1>
        <p className="text-gray-600">View all verified and approved documents</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, document type or approver"
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
                onClick={() => fetchApprovedSubmissions()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Approved Submissions Table */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading approved submissions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="mt-2 text-gray-800 font-medium">{error}</p>
            <button
              onClick={() => fetchApprovedSubmissions()}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No approved submissions match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        {submission.dateSubmitted}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {submission.approvedAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.approvedBy}
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
                          onClick={() => handleRevoke(submission.id)}
                          className="p-1 bg-red-100 hover:bg-red-200 text-red-800 rounded"
                          title="Revoke Approval"
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

export default AdminApprovedSubmissionsPage;