'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Bell,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  ChevronDown,
  LogOut,
  FileText,
  AlertCircle,
  Camera,
  Flag
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import WeeklySubmissionsChart from '@/components/dashboard/WeeklySubmissionsChart';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import StatCard from '@/components/dashboard/StatCard';
import { useHeader } from '../layout';

import { VerificationStatusEnum } from '@/app/generated/prisma';

// Define interfaces for dashboard data
interface AdminPendingReview {
  id: string;
  userId: string;
  userName: string;
  documentType: string;
  dateSubmitted: string;
  status: VerificationStatusEnum;
}

interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  completedVerifications: number;
  rejectedVerifications: number;
}

const AdminDashboardPage = () => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    completedVerifications: 0,
    rejectedVerifications: 0,
  });
  const [pendingReviews, setPendingReviews] = useState<AdminPendingReview[]>([]); const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is authenticated and has admin role
  // useEffect(() => {
  //   if (!loading) {
  //     if (!user) {
  //       router.push('/access');
  //     } else if (user.role !== 'ADMIN') {
  //       router.push('/user/dashboard');
  //     } else {
  //       // Fetch admin dashboard data immediately when the component mounts
  //       fetchDashboardData();
  //     }
  //   }
  // }, [user, loading, router]);




  useEffect(() => {
    console.log('useEffect triggered', { loading, user });

    if (loading) return;



    console.log('Fetching dashboard data...');
    fetchDashboardData(true); // ✅ Confirm this logs
    setIsRefreshing(true);
  }, [user, loading]);



  // New function for refresh button
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh && isRefreshing) return; // Prevent multiple simultaneous refreshes only for manual refresh
    if (isManualRefresh) setIsRefreshing(true);
    setIsLoading(true);
    setError('');
    console.log('fetchDashboardData called with isManualRefresh:', isManualRefresh);

    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load dashboard data');
      }
      const data = await response.json();

      setStats({
        totalUsers: data.totalUsers,
        pendingVerifications: data.pendingVerifications,
        completedVerifications: data.completedVerifications,
        rejectedVerifications: data.rejectedVerifications,
      });

      setPendingReviews(data.pendingReviews);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter reviews based on search query (in production, you'd typically do this server-side)
    // This is just a simple client-side implementation for demo
    console.log('Searching for:', searchQuery);
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const review = pendingReviews.find(r => r.id === reviewId);
      if (!review) return;

      const response = await fetch(`/api/admin/submissions/${review.userId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: review.id,
          documentStatus: 'APPROVED',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve document');
      }

      setPendingReviews(prevReviews =>
        prevReviews.filter(review => review.id !== reviewId)
      );

      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
        completedVerifications: prev.completedVerifications + 1
      }));
    } catch (err) {
      console.error('Error approving document:', err);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const review = pendingReviews.find(r => r.id === reviewId);
      if (!review) return;

      const response = await fetch(`/api/admin/submissions/${review.userId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: review.id,
          documentStatus: 'REJECTED',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject document');
      }

      setPendingReviews(prevReviews =>
        prevReviews.filter(review => review.id !== reviewId)
      );

      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
        rejectedVerifications: prev.rejectedVerifications + 1
      }));
    } catch (err) {
      console.error('Error rejecting document:', err);
    }
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };
  // Use the header context to update the header title and subtitle
  const { updateHeader } = useHeader();

  useEffect(() => {
    updateHeader('Admin Dashboard', 'Manage user verification and review documents');
  }, [updateHeader]);

  // Filter pending reviews based on status
  const filteredReviews = pendingReviews.filter(review => {
    if (statusFilter === 'all') return true;
    return review.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }
  return (
    <div className="w-full">
      {/* Main content */}
      <main className="p-2 sm:p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard
            title="Total Users"
            value={isLoading ? "..." : stats.totalUsers}
            icon={Users}
            isLoading={isLoading}
          />
          <StatCard
            title="Pending Verifications"
            value={isLoading ? "..." : stats.pendingVerifications}
            icon={Clock}
            isLoading={isLoading}
          />
          <StatCard
            title="Completed Verifications"
            value={isLoading ? "..." : stats.completedVerifications}
            icon={CheckCircle}
            isLoading={isLoading}
          />
          <StatCard
            title="Rejected Verifications"
            value={isLoading ? "..." : stats.rejectedVerifications}
            icon={XCircle}
            isLoading={isLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-6">
            <WeeklySubmissionsChart />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-6">
            <StatusDistributionChart />
          </div>
        </div>

        {/* Pending Document Reviews */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-lg md:text-xl font-bold">Pending Document Reviews</h2>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 ${isRefreshing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium rounded-lg flex items-center justify-center sm:justify-start`}
            >
              {isRefreshing ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Search and Filter */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or document"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </form>
                <div className="flex items-center">
                  <label className="mr-2 text-sm text-gray-700">Status:</label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
            {/* Reviews Table */}
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading reviews...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
                <p className="mt-2 text-gray-800 font-medium">{error}</p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No pending reviews match your filter criteria.</p>
              </div>
            ) : (
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
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-2 md:mr-3 flex-shrink-0">
                              {review.userName.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-sm md:text-base truncate">{review.userName}</div>
                              <div className="text-xs md:text-sm text-gray-500 truncate hidden sm:block">ID: {review.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {review.documentType.includes('Selfie') ? (
                              <Camera className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                            )}
                            <span className="text-sm md:text-base truncate max-w-[120px] md:max-w-none">{review.documentType}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                          {review.dateSubmitted}
                        </td>
                        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${review.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            review.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              ''
                            }`}>
                            {review.status === 'PENDING' ? 'Pending' :
                              review.status === 'IN_PROGRESS' ? 'In Progress' :
                                ''}
                          </span>
                        </td>
                        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1 md:space-x-2">
                            <button
                              onClick={() => handleViewDetails(review.userId)}
                              className="px-2 py-1 md:px-3 md:py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="px-2 py-1 md:px-3 md:py-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              className="px-2 py-1 md:px-3 md:py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded"
                            >
                              Reject
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
      </main>
    </div>
  );
};

export default AdminDashboardPage;