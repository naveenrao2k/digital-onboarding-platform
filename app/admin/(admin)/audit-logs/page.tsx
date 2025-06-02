'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  AlertCircle,
  Clock,
  User,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useHeader } from '../layout';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

const AdminAuditLogsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { updateHeader } = useHeader();

  useEffect(() => {
    updateHeader('Audit Logs', 'Track and monitor all admin activities');
  }, [updateHeader]);

  // Check if user is authenticated and has admin role
  useEffect(() => {
    fetchAuditLogs();
    if (!loading && user) {
      fetchAuditLogs();
    }
  }, [user, loading]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Fetch audit logs from API
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
      
      // Fallback to mock data for development
      setAuditLogs([
        {
          id: 'log_1',
          userId: 'user_1',
          userName: 'John Smith',
          action: 'DOCUMENT_UPLOAD',
          resourceType: 'KYCDocument',
          resourceId: 'doc_1',
          timestamp: '2025-05-23 14:32:15',
          details: 'Uploaded passport document',
          ipAddress: '192.168.1.1'
        },
        {
          id: 'log_2',
          userId: 'admin_1',
          userName: 'Admin User',
          action: 'DOCUMENT_APPROVED',
          resourceType: 'KYCDocument',
          resourceId: 'doc_2',
          timestamp: '2025-05-23 15:10:22',
          details: 'Approved ID card document for Emily Johnson',
          ipAddress: '192.168.1.2'
        },
        {
          id: 'log_3',
          userId: 'admin_1',
          userName: 'Admin User',
          action: 'DOCUMENT_REJECTED',
          resourceType: 'KYCDocument',
          resourceId: 'doc_3',
          timestamp: '2025-05-22 11:45:30',
          details: 'Rejected utility bill document for Michael Brown - Document unclear',
          ipAddress: '192.168.1.2'
        },
        {
          id: 'log_4',
          userId: 'user_4',
          userName: 'Sarah Williams',
          action: 'SELFIE_UPLOAD',
          resourceType: 'SelfieVerification',
          resourceId: 'selfie_1',
          timestamp: '2025-05-22 09:20:11',
          details: 'Uploaded selfie verification',
          ipAddress: '192.168.1.3'
        },
        {
          id: 'log_5',
          userId: 'admin_2',
          userName: 'Admin Manager',
          action: 'USER_STATUS_CHANGE',
          resourceType: 'User',
          resourceId: 'user_5',
          timestamp: '2025-05-21 16:05:45',
          details: 'Changed user status from PENDING to VERIFIED',
          ipAddress: '192.168.1.4'
        },
        {
          id: 'log_6',
          userId: 'user_6',
          userName: 'Lisa Anderson',
          action: 'USER_LOGIN',
          resourceType: 'User',
          resourceId: 'user_6',
          timestamp: '2025-05-21 10:30:22',
          details: 'User logged in successfully',
          ipAddress: '192.168.1.5'
        },
        {
          id: 'log_7',
          userId: 'user_7',
          userName: 'Robert Wilson',
          action: 'DOCUMENT_UPLOAD',
          resourceType: 'KYCDocument',
          resourceId: 'doc_7',
          timestamp: '2025-05-20 14:15:33',
          details: 'Uploaded ID card document',
          ipAddress: '192.168.1.6'
        },
        {
          id: 'log_8',
          userId: 'admin_1',
          userName: 'Admin User',
          action: 'DOCUMENT_APPROVED',
          resourceType: 'KYCDocument',
          resourceId: 'doc_8',
          timestamp: '2025-05-20 11:22:18',
          details: 'Approved utility bill document for Jennifer Taylor',
          ipAddress: '192.168.1.2'
        },
        {
          id: 'log_9',
          userId: 'admin_2',
          userName: 'Admin Manager',
          action: 'SELFIE_REJECTED',
          resourceType: 'SelfieVerification',
          resourceId: 'selfie_2',
          timestamp: '2025-05-19 15:40:55',
          details: 'Rejected selfie verification for Thomas Moore - Face not clearly visible',
          ipAddress: '192.168.1.4'
        },
        {
          id: 'log_10',
          userName: 'System',
          userId: 'system',
          action: 'SYSTEM_BACKUP',
          resourceType: 'System',
          resourceId: 'backup_1',
          timestamp: '2025-05-19 00:00:01',
          details: 'Automated daily backup completed successfully',
          ipAddress: '127.0.0.1'
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter logs based on search query (in production, you'd typically do this server-side)
    console.log('Searching for:', searchQuery);
  };

  const handleViewUserDetails = (userId: string) => {
    if (userId === 'system') return; // System user has no details page
    router.push(`/admin/users/${userId}`);
  };

  // Filter audit logs based on filters
  const filteredLogs = auditLogs.filter(log => {
    // Action filter
    if (actionFilter !== 'all' && !log.action.includes(actionFilter)) {
      return false;
    }
    
    // Search query filter (case insensitive)
    if (searchQuery && !(
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });

  // Get unique actions for filter
  const actionTypes = Array.from(new Set(auditLogs.map(log => {
    // Extract the main action type (before underscore)
    const actionParts = log.action.split('_');
    return actionParts[0];
  })));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6">
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Search and Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 gap-3">
            <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, action or details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700">Action:</label>
                <div className="relative">
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Actions</option>
                    {actionTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700 whitespace-nowrap">Date Range:</label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="mt-2 text-gray-800 font-medium">{error}</p>
            <button
              onClick={() => fetchAuditLogs()}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No audit logs match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-3 md:px-6">User</th>
                  <th className="px-3 py-3 md:px-6">Action</th>
                  <th className="px-3 py-3 md:px-6 hidden md:table-cell">Resource</th>
                  <th className="px-3 py-3 md:px-6 hidden sm:table-cell">Date & Time</th>
                  <th className="px-3 py-3 md:px-6 hidden lg:table-cell">IP Address</th>
                  <th className="px-3 py-3 md:px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium mr-2 md:mr-3 ${
                          log.userId === 'system' ? 'bg-gray-500' : 'bg-blue-600'
                        }`}>
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm truncate">{log.userName}</div>
                          {log.userId !== 'system' && (
                            <button
                              onClick={() => handleViewUserDetails(log.userId)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View Profile
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.action.includes('APPROVED') ? 'bg-green-100 text-green-800' :
                        log.action.includes('REJECTED') ? 'bg-red-100 text-red-800' :
                        log.action.includes('UPLOAD') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('LOGIN') ? 'bg-purple-100 text-purple-800' :
                        log.action.includes('SYSTEM') ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm hidden md:table-cell">
                      <div className="flex items-center">
                        {log.resourceType === 'KYCDocument' ? (
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        ) : log.resourceType === 'User' ? (
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                        ) : (
                          <div className="h-4 w-4 mr-2" />
                        )}
                        <span>{log.resourceType}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm hidden sm:table-cell">
                      {log.timestamp}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden lg:table-cell">
                      {log.ipAddress}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <p className="text-xs md:text-sm truncate max-w-[150px] md:max-w-[250px] lg:max-w-md" title={log.details}>
                        {log.details}
                      </p>
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

export default AdminAuditLogsPage;