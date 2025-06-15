'use client';

import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FraudCheckTool() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        ipAddress: '',
        emailAddress: '',
        phoneNumber: '',
        bvn: '',
        checkType: 'COMBINED_CHECK' as 'IP_CHECK' | 'EMAIL_CHECK' | 'PHONE_CHECK' | 'CREDIT_CHECK' | 'COMBINED_CHECK'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/user/fraud-detection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to perform fraud check');
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Fraud check error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-6">
                <Shield className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold">Fraud Detection Tool</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check Type</label>
                    <select
                        name="checkType"
                        value={formData.checkType}
                        onChange={handleChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="COMBINED_CHECK">Combined Check</option>
                        <option value="IP_CHECK">IP Address Check</option>
                        <option value="EMAIL_CHECK">Email Check</option>
                        <option value="PHONE_CHECK">Phone Number Check</option>
                        <option value="CREDIT_CHECK">Credit Check (BVN)</option>
                    </select>
                </div>

                {(formData.checkType === 'IP_CHECK' || formData.checkType === 'COMBINED_CHECK') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                        <input
                            type="text"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleChange}
                            placeholder="e.g., 192.168.1.1"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required={formData.checkType === 'IP_CHECK'}
                        />
                    </div>
                )}

                {(formData.checkType === 'EMAIL_CHECK' || formData.checkType === 'COMBINED_CHECK') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="emailAddress"
                            value={formData.emailAddress}
                            onChange={handleChange}
                            placeholder="e.g., user@example.com"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required={formData.checkType === 'EMAIL_CHECK'}
                        />
                    </div>
                )}

                {(formData.checkType === 'PHONE_CHECK' || formData.checkType === 'COMBINED_CHECK') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="e.g., +2348012345678"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required={formData.checkType === 'PHONE_CHECK'}
                        />
                    </div>
                )}

                {(formData.checkType === 'CREDIT_CHECK' || formData.checkType === 'COMBINED_CHECK') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BVN</label>
                        <input
                            type="text"
                            name="bvn"
                            value={formData.bvn}
                            onChange={handleChange}
                            placeholder="e.g., 12345678901"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required={formData.checkType === 'CREDIT_CHECK'}
                        />
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                        {loading ? 'Processing...' : 'Run Fraud Check'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {result && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Fraud Check Result</h3>

                    {result.overallRisk !== undefined && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Overall Risk Score</span>
                                <span className={`text-sm font-semibold ${result.overallRisk > 70 ? 'text-red-600' : result.overallRisk > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {Math.round(result.overallRisk)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${result.overallRisk > 70 ? 'bg-red-500' : result.overallRisk > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, result.overallRisk))}%` }}
                                ></div>
                            </div>

                            <div className="mt-2 flex items-center">
                                {result.overallRisk > 70 ? (
                                    <>
                                        <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                        <span className="text-sm text-red-700">High risk detected</span>
                                    </>
                                ) : result.overallRisk > 30 ? (
                                    <>
                                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                                        <span className="text-sm text-yellow-700">Medium risk detected</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                        <span className="text-sm text-green-700">Low risk</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                            <h4 className="font-medium text-gray-900">Detailed Results</h4>
                        </div>
                        <div className="p-4 max-h-96 overflow-auto">
                            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
