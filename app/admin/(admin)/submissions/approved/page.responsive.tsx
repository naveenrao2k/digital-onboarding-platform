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
  Calendar,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useHeader } from '../../layout';
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
  const [showFilters, setShowFilters] = useState(false);
  const { updateHeader } = useHeader();

  // Check if user is authenticated and has admin role
  useEffect(() => {
     fetchApprovedSubmissions();
    if (loading) {
      
        fetchApprovedSubmissions();
    
    }
  }, [user, loading, router]);

  useEffect(() => {
    updateHeader('Approved Submissions', 'View all documents that have been approved');
  }, [updateHeader]);

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
          id: 'doc_12',
          userId: 'user_12',
          userName: 'Barbara White',
          documentType: 'Driver License',
          dateSubmitted: '2025-05-12',
          approvedAt: '2025-05-13 16:20:30',
          approvedBy: 'Admin User',
          fileName: 'license.jpg'
        },
        {
          id: 'doc_14',
          userId: 'user_14',
          userName: 'Elizabeth Harris',
          documentType: 'National ID',
          dateSubmitted: '2025-05-10',
          approvedAt: '2025-05-11 10:05:15',
          approvedBy: 'Admin Manager',
          fileName: 'national_id.pdf'
        }
      ]);
    } catch (err) {
      console.error('Error fetching approved submissions:', err);
      setError('Failed to load approved submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/admin/submissions/${submissionId}`);
  };

  const handleDownload = (submissionId: string, fileName: string) => {
    // In a real implementation, this would trigger a file download
    alert(`Downloading ${fileName}...`);
  };

  // Filter approved submissions by search query and other filters
  const filteredSubmissions = approvedSubmissions.filter(submission => {
    // Check search query
    const matchesSearch = 
      searchQuery === '' ||
      submission.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check document type filter
    const matchesDocumentType = 
      documentTypeFilter === 'all' ||
      submission.documentType.toLowerCase() === documentTypeFilter.toLowerCase();
    
    // Check date filter
    let matchesDate = true;
    if (dateFilter === 'last7days') {
      const submitDate = new Date(submission.dateSubmitted);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = submitDate >= sevenDaysAgo;
    } else if (dateFilter === 'last30days') {
      const submitDate = new Date(submission.dateSubmitted);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = submitDate >= thirtyDaysAgo;
    }
    
    return matchesSearch && matchesDocumentType && matchesDate;
  });

  const documentTypes = Array.from(new Set(approvedSubmissions.map(s => s.documentType.toLowerCase())));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading approved submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 h-64">
        <AlertCircle className="h-10 w-10 mb-2" />
        <h3 className="text-lg font-medium">{error}</h3>
        <button 
          onClick={fetchApprovedSubmissions} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search submissions..."
              className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Filter Toggle for Mobile */}
          <button 
            className="flex sm:hidden items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(documentTypeFilter !== 'all' || dateFilter !== 'all') && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
                {(documentTypeFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="relative">
              <select
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Document Types</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Dates</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 sm:hidden space-y-4 border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Document Type</label>
              <div className="relative">
                <select
                  value={documentTypeFilter}
                  onChange={(e) => setDocumentTypeFilter(e.target.value)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Document Types</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Dates</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No approved submissions found</h3>
            <p className="text-gray-500">Try changing your search criteria or filters</p>
          </div>
        ) : (
          <>
            {/* Table Header - Hidden on Mobile */}
            <div className="hidden sm:grid sm:grid-cols-5 bg-gray-50 font-medium text-xs uppercase tracking-wider text-gray-500">
              <div className="px-6 py-3">User</div>
              <div className="px-6 py-3">Document Type</div>
              <div className="px-6 py-3">Approval Date</div>
              <div className="px-6 py-3">Approved By</div>
              <div className="px-6 py-3 text-right">Actions</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="flex flex-col sm:grid sm:grid-cols-5 sm:items-center gap-2 sm:gap-0 p-4 sm:py-3 hover:bg-gray-50"
                >
                  <div className="sm:hidden text-xs font-medium text-gray-500 flex justify-between">
                    <span>User</span>
                    <span className="text-blue-600">{submission.approvedAt.split(' ')[0]}</span>
                  </div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 font-medium">
                    {submission.userName}
                  </div>
                  
                  <div className="sm:hidden text-xs font-medium text-gray-500">Document Type</div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 text-gray-500 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-blue-600" />
                    {submission.documentType}
                  </div>
                  
                  <div className="hidden sm:block sm:px-6 sm:py-3 text-gray-500">
                    {submission.approvedAt.split(' ')[0]}
                  </div>
                  
                  <div className="sm:hidden text-xs font-medium text-gray-500">Approved By</div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 text-gray-500">
                    {submission.approvedBy}
                  </div>
                  
                  <div className="px-0 sm:px-6 py-0 sm:py-3 flex sm:justify-end gap-2">
                    <button
                      onClick={() => handleViewSubmission(submission.id)}
                      className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-xs font-medium"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(submission.id, submission.fileName)}
                      className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminApprovedSubmissionsPage;
