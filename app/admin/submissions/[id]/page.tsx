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

  useEffect(() => {
    // Simulate API fetch
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      // Mock data
      setSubmission({
        id: submissionId,
        user: {
          id: "user_123",
          name: "Jane Doe",
          email: "jane.doe@example.com",
        },
        submittedAt: "2025-05-25T14:30:00Z",
        status: "PENDING",
        documents: [
          {
            id: "doc1",
            type: "ID Card",
            fileName: "idcard_jane.pdf",
            url: "/api/admin/submissions/1/download?id=doc1",
          },
          {
            id: "doc2",
            type: "Utility Bill",
            fileName: "utility_jane.pdf",
            url: "/api/admin/submissions/1/download?id=doc2",
          },
        ],
        notes: "User submitted all required documents.",
      });
      setAuditLogs([
        {
          id: "log1",
          action: "SUBMITTED",
          performedBy: "Jane Doe",
          timestamp: "2025-05-25T14:30:00Z",
          details: "Initial submission."
        },
        {
          id: "log2",
          action: "REVIEWED",
          performedBy: "Admin User",
          timestamp: "2025-05-26T10:00:00Z",
          details: "Checked documents."
        },
      ]);
      setIsLoading(false);
    }, 800);
  }, [submissionId]);

  const handleAction = async (action: "APPROVE" | "REJECT" | "FLAG") => {
    setActionLoading(true);
    setActionError("");
    setSuccessMessage("");
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmission((prev) =>
        prev ? { ...prev, status: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "FLAGGED" } : prev
      );
      setSuccessMessage(`Submission ${action.toLowerCase()}d successfully!`);
      setAuditLogs((prev) => [
        ...prev,
        {
          id: `log${prev.length + 1}`,
          action,
          performedBy: "Admin User",
          timestamp: new Date().toISOString(),
          details: `Submission ${action.toLowerCase()}d by admin.`
        }
      ]);
    } catch (err) {
      setActionError("Failed to update submission status. Please try again.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMessage(""), 2500);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline flex items-center">
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Submission Details</h1>
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
