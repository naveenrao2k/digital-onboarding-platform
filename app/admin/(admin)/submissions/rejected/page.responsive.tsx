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
  const [showFilters, setShowFilters] = useState(false);
  const { updateHeader } = useHeader();

  // Check if user is authenticated and has admin role
  useEffect(() => {
    fetchRejectedSubmissions();
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

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDownload = (submissionId: string, fileName: string) => {
    // In a real implementation, you would download the file
    alert(`Downloading ${fileName}...`);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading rejected submissions...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading rejected submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 h-64">
        <AlertCircle className="h-10 w-10 mb-2" />
        <h3 className="text-lg font-medium">{error}</h3>
        <button 
          onClick={fetchRejectedSubmissions} 
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
            {documentTypeFilter !== 'all' && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
                1
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
            
            <button 
              onClick={fetchRejectedSubmissions}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
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
            
            <div className="pt-2">
              <button 
                onClick={fetchRejectedSubmissions}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Apply Filters & Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rejected submissions found</h3>
            <p className="text-gray-500">Try changing your search criteria or filters</p>
          </div>
        ) : (
          <>
            {/* Table Header - Hidden on Mobile */}
            <div className="hidden sm:grid sm:grid-cols-6 bg-gray-50 font-medium text-xs uppercase tracking-wider text-gray-500">
              <div className="px-6 py-3">User</div>
              <div className="px-6 py-3">Document Type</div>
              <div className="px-6 py-3">Rejection Reason</div>
              <div className="px-6 py-3">Rejected By</div>
              <div className="px-6 py-3">Date</div>
              <div className="px-6 py-3 text-right">Actions</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="flex flex-col sm:grid sm:grid-cols-6 sm:items-center gap-2 sm:gap-0 p-4 sm:py-3 hover:bg-gray-50"
                >
                  {/* User Column */}
                  <div className="sm:hidden text-xs font-medium text-gray-500 flex justify-between">
                    <span>User</span>
                    <span className="text-blue-600">{submission.rejectedAt.split(' ')[0]}</span>
                  </div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-3 flex-shrink-0">
                      {submission.userName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{submission.userName}</div>
                      <div className="text-xs text-gray-500 truncate">ID: {submission.userId}</div>
                    </div>
                  </div>
                  
                  {/* Document Type Column */}
                  <div className="sm:hidden text-xs font-medium text-gray-500">Document Type</div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 text-gray-500 flex items-center">
                    {submission.documentType.includes('Selfie') ? (
                      <Camera className="h-4 w-4 mr-1 text-blue-600 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1 text-blue-600 flex-shrink-0" />
                    )}
                    <span className="truncate">{submission.documentType}</span>
                  </div>
                  
                  {/* Rejection Reason Column */}
                  <div className="sm:hidden text-xs font-medium text-gray-500">Rejection Reason</div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3">
                    <div className="flex items-start">
                      <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{submission.rejectionReason}</span>
                    </div>
                  </div>
                  
                  {/* Rejected By Column */}
                  <div className="sm:hidden text-xs font-medium text-gray-500">Rejected By</div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 text-gray-500 text-sm">
                    {submission.rejectedBy}
                  </div>
                  
                  {/* Date Column (Hidden on mobile since we show it on top) */}
                  <div className="hidden sm:block sm:px-6 sm:py-3 text-gray-500 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                      {submission.rejectedAt.split(' ')[0]}
                    </div>
                  </div>
                  
                  {/* Actions Column */}
                  <div className="sm:hidden text-xs font-medium text-gray-500">Actions</div>
                  <div className="px-0 sm:px-6 py-0 sm:py-3 flex sm:justify-end gap-2">
                    <button
                      onClick={() => handleViewDetails(submission.userId)}
                      className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-xs font-medium"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(submission.id, submission.fileName)}
                      className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium"
                    >
                      <Download className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      Download
                    </button>
                    <button
                      onClick={() => handleRequestResubmission(submission.id)}
                      className="flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded text-white text-xs font-medium"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      Request Resubmission
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

export default AdminRejectedSubmissionsPage;
