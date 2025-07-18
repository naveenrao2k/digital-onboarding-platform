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
  Clock,
  Calendar,
  Eye,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useHeader } from '../hooks';
import { VerificationStatusEnum } from '@/app/generated/prisma';
import Pagination from '@/components/common/Pagination';

interface Submission {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  documentType: string;
  dateSubmitted: string;
  status: VerificationStatusEnum;
  fileName: string;
  totalDocuments: number;
  submissionType?: 'documents' | 'scuml';
  scumlNumber?: string;
}

const AdminSubmissionsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(''); const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { updateHeader } = useHeader();

  useEffect(() => {
    updateHeader('Document Submissions', 'Manage and review all submitted documents');
  }, [updateHeader]);
  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading && user) {
      fetchSubmissions();
    }
  }, [user, loading, currentPage]);
  const fetchSubmissions = async (isManualRefresh = false) => {

    if (isManualRefresh && isRefreshing) return; // Prevent multiple simultaneous refreshes
    if (isManualRefresh) setIsRefreshing(true);
    setIsLoading(true);
    setError('');

    try {
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (documentTypeFilter !== 'all') params.append('documentType', documentTypeFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', '10'); // Adjust limit as needed

      const response = await fetch(`/api/admin/submissions?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      const data = await response.json();

      if (data.data && data.pagination) {
        setSubmissions(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        // Handle legacy response format
        setSubmissions(data);
      }
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.message || 'An error occurred while fetching submissions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when searching
    fetchSubmissions();
  };
  const handleViewSubmission = (userId: string) => {
    router.push(`/admin/submissions/${userId}`);
  };



  // Filter submissions based on filters
  const filteredSubmissions = submissions.filter(submission => {
    // Status filter
    if (statusFilter !== 'all' && submission.status !== statusFilter) {
      return false;
    }

    // Document type filter
    if (documentTypeFilter !== 'all' && submission.documentType !== documentTypeFilter) {
      return false;
    }

    // Search query filter (case insensitive)
    if (searchQuery && !(
      submission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    )) {
      return false;
    }

    return true;
  });

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(submissions.map(s => s.documentType)));

  return (
    <div className="w-full">

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
        {/* Search and Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 md:gap-4">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or document type"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700 whitespace-nowrap">Status:</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset to page 1 when changing filters
                      fetchSubmissions();
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>

              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700 whitespace-nowrap">Document:</label>
                <div className="relative">
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => {
                      setDocumentTypeFilter(e.target.value);
                      setCurrentPage(1); // Reset to page 1 when changing filters
                      fetchSubmissions();
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {documentTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>              <button
                onClick={() => {
                  setCurrentPage(1); // Reset to page 1 when refreshing
                  fetchSubmissions(true);
                }}
                className={`px-3 py-2 ${isRefreshing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium rounded-lg flex items-center`}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="sm:inline">Refreshing...</span>
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="mt-2 text-gray-800 font-medium">{error}</p>
            <button
              onClick={() => fetchSubmissions()}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No submissions match your filter criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-3 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-3 py-3 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-3 py-3 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="px-3 py-3 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-2 md:mr-3 flex-shrink-0">
                            {submission.userName.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-sm md:text-base truncate">{submission.userName}</div>
                            <div className="text-xs md:text-sm text-gray-500 truncate hidden sm:block">ID: {submission.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {submission.submissionType === 'scuml' ? (
                            <>
                              <div className="h-4 w-4 text-green-600 mr-2 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm md:text-base text-green-800 font-medium">{submission.documentType}</div>
                                <div className="text-xs text-green-600 truncate max-w-[120px] hidden sm:block">
                                  {submission.scumlNumber}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                              <div>
                                <div className="text-sm md:text-base truncate max-w-[120px] md:max-w-none">{submission.documentType}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px] hidden sm:block">
                                  {submission.totalDocuments > 1
                                    ? `${submission.totalDocuments} documents submitted`
                                    : submission.fileName}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                        <div className="flex items-center">


                          <Calendar className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                          <div>
                            {new Date(submission.dateSubmitted).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            <div className="text-xs text-gray-500">
                              {new Date(submission.dateSubmitted).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${submission.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          submission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                ''
                          }`}>
                          {submission.status === 'PENDING' ? 'Pending' :
                            submission.status === 'IN_PROGRESS' ? 'In Progress' :
                              submission.status === 'APPROVED' ? 'Approved' :
                                submission.status === 'REJECTED' ? 'Rejected' :
                                  ''}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-6 md:py-4 ">

                        <button
                          onClick={() => handleViewSubmission(submission.userId)}
                          className="p-1 flex text-xs font-semibold gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
                          title="View Details"
                        >
                          View
                          {/* <Eye className="h-4 w-4" /> */}
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination component */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    fetchSubmissions();
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSubmissionsPage;