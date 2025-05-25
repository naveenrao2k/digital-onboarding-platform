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

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // Redirect non-admin users
        // router.push('/user/dashboard');
      } else {
        // Fetch audit logs data
        fetchAuditLogs();
      }
    }
  }, [user, loading, router]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch this data from API
      // For demo purposes, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock audit logs data
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
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-gray-600">Track all system activities and user actions</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs by user, action or details"
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
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Actions</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="USER">User</option>
                    <option value="SELFIE">Selfie</option>
                    <option value="SYSTEM">System</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
              
              <button 
                onClick={() => fetchAuditLogs()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
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
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full ${log.userId === 'system' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'} flex items-center justify-center font-medium mr-3`}>
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-sm text-gray-500">{log.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.action.includes('APPROVED') ? 'bg-green-100 text-green-800' :
                        log.action.includes('REJECTED') ? 'bg-red-100 text-red-800' :
                        log.action.includes('UPLOAD') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('LOGIN') ? 'bg-purple-100 text-purple-800' :
                        log.action.includes('SYSTEM') ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div>{log.resourceType}</div>
                        <div className="text-xs text-gray-500">{log.resourceId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-md truncate">{log.details}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress}
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