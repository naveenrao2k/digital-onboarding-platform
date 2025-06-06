"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Download, CheckCircle, XCircle, Flag, Loader2, AlertCircle, FileText, User } from "lucide-react";
import { useHeader } from '../../layout';
import DojahVerificationDisplay from '@/components/admin/DojahVerificationDisplay';

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
    status?: string;
    documentAnalysis?: {
      extractedText?: string;
      extractedData?: any;
      documentType?: string;
      confidence?: number;
      isReadable: boolean;
      qualityScore?: number;
    };
    dojahVerification?: {
      id: string;
      status: string;
      confidence?: number;
      matchResult?: any;
      extractedData?: any;
      governmentData?: any;
      errorMessage?: string;
      createdAt: string;
      steps?: Array<{
        name: string;
        status: string;
        completedAt?: string;
        duration?: number;
      }>;
    };
  }>;
  notes: string;
  governmentVerifications?: Array<{
    type: string;
    status: string;
    isMatch: boolean;
    confidence?: number;
    governmentData?: any;
    createdAt: string;
  }>;
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
  const submissionId = params?.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { updateHeader } = useHeader();

  useEffect(() => {
    if (submission) {
      updateHeader(
        `Submission: ${submission.documents[0]?.type || 'Document'}`, 
        `Review submission from ${submission.user.name}`
      );
    } else {
      updateHeader('Submission Details', 'Loading submission information...');
    }
  }, [submission, updateHeader]);

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
  }  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Submissions
        </button>
        <div className="flex items-center gap-2">
          {successMessage && (
            <span className="text-sm text-green-600">{successMessage}</span>
          )}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{submission.user.name}</h2>
                  <p className="text-sm text-gray-500">{submission.user.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
            <div className="text-sm text-gray-600">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </div>
            {submission.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                {submission.notes}
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Submitted Documents
            </h3>
            <div className="space-y-4">
              {submission.documents.map((doc) => (
                <div key={doc.id} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <div className="font-medium">{doc.type}</div>
                      <div className="text-sm text-gray-500">{doc.fileName}</div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </div>
                  
                  {/* Dojah Verification Display */}
                  {(doc.documentAnalysis || doc.dojahVerification) && (
                    <DojahVerificationDisplay
                      document={{
                        ...doc,
                        status: doc.status || "PENDING" // Default to PENDING if no status
                      }}
                      documentDetails={{
                        id: doc.id,
                        userId: submission.user.id,
                        type: doc.type,
                        fileUrl: doc.url,
                        s3Key: "", // This would need to come from your API
                        fileSize: 0, // This would need to come from your API
                        mimeType: "", // This would need to come from your API
                        fileName: doc.fileName,
                        uploadedAt: submission.submittedAt,
                        verified: submission.status === "APPROVED",
                        verifiedAt: submission.status === "APPROVED" ? submission.submittedAt : null,
                        verifiedBy: null,
                        status: submission.status,
                        notes: submission.notes
                      }}
                      governmentVerifications={submission.governmentVerifications || []}
                      onReview={async (documentId, status, notes, rejectionReason, allowReupload) => {
                        await handleAction(status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "FLAG");
                      }}
                      isReviewing={actionLoading}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Audit Log */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Review Actions</h3>
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                {actionError}
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => handleAction("APPROVE")}
                disabled={actionLoading || submission.status === "APPROVED"}
                className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading && submission.status !== "APPROVED" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve
              </button>
              <button
                onClick={() => handleAction("REJECT")}
                disabled={actionLoading || submission.status === "REJECTED"}
                className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading && submission.status !== "REJECTED" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject
              </button>
              <button
                onClick={() => handleAction("FLAG")}
                disabled={actionLoading || submission.status === "FLAGGED"}
                className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {actionLoading && submission.status !== "FLAGGED" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Flag className="h-4 w-4 mr-2" />
                )}
                Flag for Review
              </button>
            </div>
          </div>

          {/* Audit Log Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Activity History</h3>
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="text-sm">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-gray-500"> by {log.performedBy}</span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-gray-500 mt-1">{log.details}</p>
                  )}
                  <time className="text-xs text-gray-400 mt-1 block">
                    {new Date(log.timestamp).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSubmissionDetailPage;
