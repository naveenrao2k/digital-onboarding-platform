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
import Pagination from '@/components/common/Pagination';

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
  const [error, setError] = useState('');  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { updateHeader } = useHeader();

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      fetchRejectedSubmissions();
    }
  }, [user, loading, router, currentPage, documentTypeFilter]);

  useEffect(() => {
    updateHeader('Rejected Submissions', 'View and manage all rejected document submissions');
  }, [updateHeader]);
  const fetchRejectedSubmissions = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (documentTypeFilter !== 'all') {
        params.append('documentType', documentTypeFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('page', currentPage.toString());
      params.append('limit', '10'); // Adjust limit as needed

      // Fetch data from the API
      const response = await fetch(`/api/admin/submissions/rejected?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rejected submissions');
      }

      const data = await response.json();
      
      // Handle both pagination and non-pagination response formats
      if (data.data && data.pagination) {
        // New format with pagination
        setRejectedSubmissions(data.data.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          userName: item.userName,
          documentType: item.documentType,
          dateSubmitted: item.dateSubmitted,
          rejectedAt: item.dateRejected,
          rejectedBy: item.rejectedBy,
          fileName: item.fileName,
          rejectionReason: item.rejectionReason || 'Document rejected'
        })));
        setTotalPages(data.pagination.totalPages);
      } else {
        // Old format without pagination
        setRejectedSubmissions(data.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          userName: item.userName,
          documentType: item.documentType,
          dateSubmitted: item.dateSubmitted,
          rejectedAt: item.dateRejected,
          rejectedBy: item.rejectedBy,
          fileName: item.fileName,
          rejectionReason: item.rejectionReason || 'Document rejected'
        })));
      }
    } catch (err) {
      console.error('Error fetching rejected submissions:', err);
      setError('Failed to load rejected submissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when searching
    fetchRejectedSubmissions();
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };
  const handleDownload = async (userId: string, documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${userId}/download?documentId=${documentId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      // Show error notification in a real app
    }
  };
  const handleRequestResubmission = async (userId: string, documentId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      const response = await fetch(`/api/admin/submissions/${userId}/request-resubmission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          message: 'Please resubmit this document with the correct information.',
          allowReupload: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request resubmission');
      }
      
      // Show success notification (in a real app)
      alert('Resubmission request sent to user');
    } catch (err) {
      console.error('Error requesting resubmission:', err);
      // Show error notification
    }
  };
  // We don't need to filter submissions again as they are already filtered by the API
  // Using the submissions directly from the API response
  const filteredSubmissions = rejectedSubmissions;

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
    <div className="min-h-screen max-w-7xl bg-gray-50">
    
      
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
                <div className="relative">                  <select
                    value={documentTypeFilter}
                    onChange={(e) => {
                      setDocumentTypeFilter(e.target.value);
                      setCurrentPage(1); // Reset to page 1 when filter changes
                      // Trigger fetch when filter changes
                      setTimeout(() => fetchRejectedSubmissions(), 0);
                    }}
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
                        </button>                        <button
                          onClick={() => handleDownload(submission.userId, submission.id, submission.fileName)}
                          className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>                        <button
                          onClick={() => handleRequestResubmission(submission.userId, submission.id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                // fetchRejectedSubmissions will be called via useEffect when currentPage changes
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRejectedSubmissionsPage;