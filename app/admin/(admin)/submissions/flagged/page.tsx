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
import { useHeader } from '../../hooks';
import { VerificationStatusEnum } from '@/app/generated/prisma';
import Pagination from '@/components/common/Pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { updateHeader } = useHeader();
  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      fetchFlaggedSubmissions();
    }
  }, [user, loading, router, currentPage]);

  useEffect(() => {
    updateHeader('Flagged Submissions', 'Review documents that require special attention');
  }, [updateHeader]);
  const fetchFlaggedSubmissions = async () => {
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
      const response = await fetch(`/api/admin/submissions/flagged?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch flagged submissions');
      } const data = await response.json();
      setFlaggedSubmissions(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching flagged submissions:', err);
      setError('Failed to load flagged submissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }; const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when searching
    fetchFlaggedSubmissions();
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleRemoveFlag = async (userId: string, documentId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      const response = await fetch(`/api/admin/submissions/${userId}/remove-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove flag');
      }

      // Update submissions - remove the unflagged one
      setFlaggedSubmissions(prevSubmissions =>
        prevSubmissions.filter(submission => submission.id !== documentId)
      );

      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error removing flag:', err);
      // Show error notification
    }
  };
  // We don't need to filter submissions again as they are already filtered by the API
  // Using the submissions directly from the API response
  const filteredSubmissions = flaggedSubmissions;

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
    <div className="min-h-screen max-w-7xl bg-gray-50 ">


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
                <label className="mr-2 text-sm text-gray-700">Document:</label>                <div className="relative">
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => {
                      setDocumentTypeFilter(e.target.value);
                      // Trigger fetch when filter changes
                      setTimeout(() => fetchFlaggedSubmissions(), 0);
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
                      <div className="flex items-center md:max-w-[200px] overflow-hidden">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{new Date(submission.flaggedAt).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500">{new Date(submission.flaggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(submission.userId)}
                          className="px-2 py-1 bg-gray-100 text-xs font-semibold hover:bg-gray-200 text-gray-800 rounded"
                          title="View Details"
                        >
                          View
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
                // No need to call fetchFlaggedSubmissions() here as it will be triggered by the useEffect
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFlaggedSubmissionsPage;