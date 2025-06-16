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
  allowReupload: boolean;
  status: string;
  statusFormatted: string;
}

const AdminRejectedSubmissionsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rejectedSubmissions, setRejectedSubmissions] = useState<RejectedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [rejectionStatusFilter, setRejectionStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { updateHeader } = useHeader();

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      fetchRejectedSubmissions();
    }
  }, [user, loading, router, currentPage, documentTypeFilter, rejectionStatusFilter]);

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
      if (rejectionStatusFilter !== 'all') {
        params.append('status', rejectionStatusFilter);
      }
      params.append('page', currentPage.toString());
      params.append('limit', '10'); // Adjust limit as needed

      // Fetch data from the API
      const response = await fetch(`/api/admin/submissions/rejected?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rejected submissions');
      } const data = await response.json();
      console.log("Rejected submissions data:", data);

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
          rejectionReason: item.rejectionReason || 'Document rejected',
          status: item.status,
          statusFormatted: item.statusFormatted,
          allowReupload: item.allowReupload
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
          rejectionReason: item.rejectionReason || 'Document rejected',
          status: item.status,
          statusFormatted: item.statusFormatted,
          allowReupload: item.allowReupload
        })));
      }
    } catch (err) {
      console.error('Error fetching rejected submissions:', err);
      setError('Failed to load rejected submissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }; const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when searching
    fetchRejectedSubmissions();
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };
  // Apply client-side filtering for rejection status if needed
  const filteredSubmissions = rejectedSubmissions.filter(submission => {
    if (rejectionStatusFilter === 'all') return true;
    if (rejectionStatusFilter === 'REJECTED' && submission.status === 'REJECTED') return true;
    if (rejectionStatusFilter === 'REQUIRES_REUPLOAD' && submission.status === 'REQUIRES_REUPLOAD') return true;
    return false;
  });

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(rejectedSubmissions.map(s => s.documentType)));

  // Get unique rejection statuses for filter
  const rejectionStatuses = Array.from(new Set(rejectedSubmissions.map(s => s.statusFormatted)));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading rejected submissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl bg-gray-50 overflow-auto">


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

              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700">Status:</label>
                <div className="relative">
                  <select
                    value={rejectionStatusFilter}
                    onChange={(e) => {
                      setRejectionStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset to page 1 when filter changes
                      // Trigger fetch when filter changes
                      setTimeout(() => fetchRejectedSubmissions(), 0);
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >                    <option value="all">All Statuses</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REQUIRES_REUPLOAD">Requires Reupload</option>
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
                      <div className="flex flex-col space-y-2 md:max-w-[250px]">
                        <div className="flex items-start">
                          <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{submission.rejectionReason}</span>
                        </div>
                        <div className=''>
                          {submission.status === 'REQUIRES_REUPLOAD' ? (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 w-fit flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> Requires Reupload
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 w-fit flex items-center">
                              <XCircle className="h-3 w-3 mr-1" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.rejectedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        <div>
                          {new Date(submission.rejectedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                          <div className="text-xs text-gray-500">
                            {new Date(submission.rejectedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(submission.userId)}
                          className="py-1 px-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
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