"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Download, CheckCircle, XCircle, Flag, Loader2, AlertCircle, FileText, User } from "lucide-react";

// Mock types (replace with your real types)
interface SubmissionDetail {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    url: string;
  }>;
  notes: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

const AdminSubmissionDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Submission not found');
        }
        const data = await response.json();
        console.log("Submission data received:", data);
        
        // Handle different API response formats
        if (data.submission) {
          setSubmission(data.submission);
          setAuditLogs(data.auditLogs || []);
        } else {
          // If the API returns data directly without a submission wrapper
          setSubmission({
            id: data.id,
            user: {
              id: data.userId,
              name: data.userName || `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
              email: data.userEmail || data.user?.email || '',
            },
            submittedAt: data.submissionDate || data.createdAt || new Date().toISOString(),
            status: data.status || 'PENDING',
            documents: data.documents || 
              (data.KYCDocument ? data.KYCDocument.map((doc: any) => ({
                id: doc.id,
                type: doc.type || doc.documentType,
                fileName: doc.fileName,
                url: `/api/admin/submissions/${doc.id}/download`
              })) : []),
            notes: data.notes || ''
          });
          
          // Format audit logs if they exist
          if (data.auditLogs) setAuditLogs(data.auditLogs);
        }
      } catch (err: any) {
        console.error("Error fetching submission:", err);
        setError(err.message || 'Failed to load submission details');
        setSubmission(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (submissionId) fetchSubmission();
  }, [submissionId]);
  const handleAction = async (action: "APPROVE" | "REJECT" | "FLAG") => {
    if (!submission) return;
    
    setActionLoading(true);
    setActionError("");
    setSuccessMessage("");
    try {
      // Call the real API endpoint to update status
      const response = await fetch(`/api/admin/submissions/${submissionId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: action,
          notes: submission.notes
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update submission status');
      }
      
      // Update local state with the new status
      setSubmission((prev) =>
        prev ? { ...prev, status: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "FLAGGED" } : prev
      );
      
      // Add a local audit log entry (the real one will be fetched on refresh)
      const newAuditLog = {
        id: `log${Date.now()}`,
        action,
        performedBy: "Admin User",
        timestamp: new Date().toISOString(),
        details: `Submission ${action.toLowerCase()}d by admin.`
      };
      
      setAuditLogs((prev) => [newAuditLog, ...prev]);
      setSuccessMessage(`Submission ${action.toLowerCase()}d successfully!`);
      
      // Refresh data after short delay to get updated audit logs
      setTimeout(() => handleRefresh(), 1000);
    } catch (err: any) {
      console.error("Error updating submission:", err);
      setActionError(err.message || "Failed to update submission status. Please try again.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMessage(""), 2500);
    }
  };
  // Add function to refresh submission data
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh submission data');
      }
      
      const data = await response.json();
      
      // Handle different API response formats
      if (data.submission) {
        setSubmission(data.submission);
        setAuditLogs(data.auditLogs || []);
      } else {
        // If the API returns data directly without a submission wrapper
        setSubmission({
          id: data.id,
          user: {
            id: data.userId,
            name: data.userName || `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
            email: data.userEmail || data.user?.email || '',
          },
          submittedAt: data.submissionDate || data.createdAt || new Date().toISOString(),
          status: data.status || 'PENDING',
          documents: data.documents || 
            (data.KYCDocument ? data.KYCDocument.map((doc: any) => ({
              id: doc.id,
              type: doc.type || doc.documentType,
              fileName: doc.fileName,
              url: `/api/admin/submissions/${doc.id}/download`
            })) : []),
          notes: data.notes || ''
        });
        
        // Format audit logs if they exist
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      }
      
      setSuccessMessage("Submission data refreshed successfully!");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (error: any) {
      console.error("Error refreshing submission:", error);
      setActionError(error.message || 'Failed to refresh submission data');
      setTimeout(() => setActionError(""), 2500);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-blue-700">Loading submission...</span>
      </div>
    );
  }
  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
        <p className="text-lg text-red-700">{error || "Submission not found."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline flex items-center">
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold">Submission Details</h1>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 ${isRefreshing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium rounded-lg flex items-center`}
        >
          {isRefreshing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Submission Info */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <div className="font-semibold text-lg">{submission.user.name}</div>
              <div className="text-gray-500 text-sm">{submission.user.email}</div>
            </div>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              submission.status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : submission.status === "REJECTED"
                ? "bg-red-100 text-red-700"
                : submission.status === "FLAGGED"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {submission.status}
            </span>
          </div>
        </div>
        <div className="text-gray-600 text-sm mb-2">Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
        <div className="text-gray-700 text-sm">{submission.notes}</div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center"><FileText className="h-5 w-5 mr-2 text-blue-600" />Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submission.documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50">
              <div className="font-medium">{doc.type}</div>
              <div className="text-gray-500 text-xs">{doc.fileName}</div>
              <div className="flex gap-2 mt-2">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                  <Download className="h-4 w-4 mr-1" /> Download
                </a>
                {/* Optionally add a preview button for images/pdf */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Review Actions</h2>
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded text-green-800">{successMessage}</div>
        )}
        {actionError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded text-red-800">{actionError}</div>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => handleAction("APPROVE")}
            disabled={actionLoading || submission.status === "APPROVED"}
            className={`flex items-center px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50`}
          >
            {actionLoading && submission.status !== "APPROVED" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Approve
          </button>
          <button
            onClick={() => handleAction("REJECT")}
            disabled={actionLoading || submission.status === "REJECTED"}
            className={`flex items-center px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50`}
          >
            {actionLoading && submission.status !== "REJECTED" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Reject
          </button>
          <button
            onClick={() => handleAction("FLAG")}
            disabled={actionLoading || submission.status === "FLAGGED"}
            className={`flex items-center px-4 py-2 rounded bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50`}
          >
            {actionLoading && submission.status !== "FLAGGED" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
            Flag
          </button>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6 flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>}
          Refresh
        </button>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Audit Log</h2>
        <ul className="divide-y divide-gray-200">
          {auditLogs.map((log) => (
            <li key={log.id} className="py-2 text-sm flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-medium">{log.action}</span> by {log.performedBy}
                {log.details && <span className="text-gray-500 ml-2">({log.details})</span>}
              </div>
              <div className="text-gray-500 text-xs mt-1 md:mt-0">{new Date(log.timestamp).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminSubmissionDetailPage;
