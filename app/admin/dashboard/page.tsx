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
import AdminSidebar from '@/components/navigation/AdminSidebar';
import WeeklySubmissionsChart from '@/components/dashboard/WeeklySubmissionsChart';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import StatCard from '@/components/dashboard/StatCard';

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
  const [pendingReviews, setPendingReviews] = useState<AdminPendingReview[]>([]);  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // router.push('/user/dashboard');
      } else {
        // Fetch admin dashboard data immediately when the component mounts
        fetchDashboardData();
      }
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch this data from API
      // For demo purposes, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock stats data
      setStats({
        totalUsers: 124,
        pendingVerifications: 18,
        completedVerifications: 97,
        rejectedVerifications: 9,
      });

      // Mock pending reviews data
      setPendingReviews([
        {
          id: 'doc_1',
          userId: 'user_1',
          userName: 'John Smith',
          documentType: 'Passport',
          dateSubmitted: '2025-05-23',
          status: 'PENDING',
        },
        {
          id: 'doc_2',
          userId: 'user_2',
          userName: 'Emily Johnson',
          documentType: 'ID Card',
          dateSubmitted: '2025-05-22',
          status: 'IN_PROGRESS',
        },
        {
          id: 'doc_3',
          userId: 'user_3',
          userName: 'Michael Brown',
          documentType: 'Utility Bill',
          dateSubmitted: '2025-05-22',
          status: 'PENDING',
        },
        {
          id: 'doc_4',
          userId: 'user_4',
          userName: 'Sarah Williams',
          documentType: 'Selfie Verification',
          dateSubmitted: '2025-05-21',
          status: 'IN_PROGRESS',
        },
        {
          id: 'doc_5',
          userId: 'user_5',
          userName: 'David Jones',
          documentType: 'Certificate of Incorporation',
          dateSubmitted: '2025-05-20',
          status: 'PENDING',
        },
      ]);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      // In a real implementation, you would call an API endpoint
      console.log('Approving document:', reviewId);
      
      // Update pending reviews - remove the approved one
      setPendingReviews(prevReviews => 
        prevReviews.filter(review => review.id !== reviewId)
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
        completedVerifications: prev.completedVerifications + 1
      }));
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error approving document:', err);
      // Show error notification
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      // In a real implementation, you would call an API endpoint
      console.log('Rejecting document:', reviewId);
      
      // Update pending reviews - remove the rejected one
      setPendingReviews(prevReviews => 
        prevReviews.filter(review => review.id !== reviewId)
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
        rejectedVerifications: prev.rejectedVerifications + 1
      }));
      
      // Show success notification (in a real app)
    } catch (err) {
      console.error('Error rejecting document:', err);
      // Show error notification
    }
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

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
    <div className="flex">
      <div className="flex-1 min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">KYC Admin</span>
              </div>
              <div className="flex items-center">
                <button className="mr-4 text-gray-600 relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
                </button>
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.firstName?.charAt(0) || 'A'}
                </div>
                <button 
                  onClick={() => signOut()}
                  className="ml-4 flex items-center text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Manage user verification and review documents</p>
          </div>          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <WeeklySubmissionsChart />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <StatusDistributionChart />
            </div>
          </div>
          {/* Pending Document Reviews */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pending Document Reviews</h2>
              <button 
                onClick={() => fetchDashboardData()}
                disabled={isRefreshing}
                className={`px-4 py-2 ${isRefreshing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium rounded-lg flex items-center`}
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
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-3">
                                {review.userName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{review.userName}</div>
                                <div className="text-sm text-gray-500">ID: {review.userId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {review.documentType.includes('Selfie') ? (
                                <Camera className="h-4 w-4 text-gray-500 mr-2" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-500 mr-2" />
                              )}
                              <span>{review.documentType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {review.dateSubmitted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              review.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
                              review.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              ''
                            }`}>
                              {review.status === 'PENDING' ? 'Pending' : 
                               review.status === 'IN_PROGRESS' ? 'In Progress' : 
                               ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewDetails(review.userId)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleApprove(review.id)}
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(review.id)}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded"
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
    </div>
  );
};

export default AdminDashboardPage;