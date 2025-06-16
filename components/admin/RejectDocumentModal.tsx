'use client';

import React, { useState } from 'react';
import { XCircle, X } from 'lucide-react';

interface RejectDocumentModalProps {
    open: boolean;
    onClose: () => void;
    onReject: (reviewId: string, reason: string, allowReupload: boolean) => void;
    reviewId: string;
    documentType?: string;
}

const RejectDocumentModal: React.FC<RejectDocumentModalProps> = ({
    open,
    onClose,
    onReject,
    reviewId,
    documentType = 'Document'
}) => {
    const [reason, setReason] = useState('');
    const [allowReupload, setAllowReupload] = useState(true);

    if (!open) return null;
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReject(reviewId, reason, allowReupload);
        setReason('');
        setAllowReupload(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Reject {documentType}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label htmlFor="reason" className="block mb-2 text-sm font-medium text-gray-700">
                            Rejection Reason
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            required
                            placeholder="Please provide a reason for rejection..."
                        />
                    </div>

                    <div className="mb-4 flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="allowReupload"
                                type="checkbox"
                                checked={allowReupload}
                                onChange={(e) => setAllowReupload(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3">
                            <label htmlFor="allowReupload" className="text-sm font-medium text-gray-700">
                                Allow user to reupload document
                            </label>
                            <p className="text-xs text-gray-500">
                                If checked, the user will be able to upload a new document to replace this one.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                            disabled={!reason.trim()}
                        >              <div className="flex items-center">
                                <XCircle className="h-4 w-4 mr-2" />
                                {allowReupload ? 'Reject & Allow Reupload' : 'Reject Document'}
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RejectDocumentModal;
