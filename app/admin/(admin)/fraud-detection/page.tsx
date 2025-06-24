'use client';

import FraudDetectionDashboard from '@/components/admin/FraudDetectionDashboard';
import CreditBureauCheck from '@/components/admin/CreditBureauCheck';
import TransactionAnalysis from '@/components/admin/TransactionAnalysis';
import { useHeader } from '../layout';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

export default function FraudDetectionPage() {
    const { updateHeader } = useHeader();
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        updateHeader('Fraud Detection Dashboard', 'Monitor and manage fraud detection results');
    }, [updateHeader]);

    return (
        <div className="">
            <div className="max-w-7xl mx-auto">
                {/* Tabs for different fraud detection systems */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`${
                                    activeTab === 'general' 
                                    ? 'border-indigo-500 text-indigo-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                General Fraud Checks
                            </button>                            <button
                                onClick={() => setActiveTab('credit')}
                                className={`${
                                    activeTab === 'credit' 
                                    ? 'border-indigo-500 text-indigo-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Credit Bureau Checks
                            </button>
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={`${
                                    activeTab === 'transactions' 
                                    ? 'border-indigo-500 text-indigo-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Transaction Analysis
                            </button>
                        </nav>
                    </div>
                </div>                {/* Show the actual dashboard based on the active tab */}
                {activeTab === 'general' && (
                    <div className="bg-white shadow rounded-lg">
                        <FraudDetectionDashboard />
                    </div>
                )}
                {activeTab === 'credit' && <CreditBureauCheck />}
                {activeTab === 'transactions' && <TransactionAnalysis />}

                {/* Uncomment this section and comment out the line above if you want to see example data */}
                {/*
                <div className="bg-white shadow rounded-lg">
                    <h2 className="text-xl font-semibold p-6 border-b">Fraud Detection Results (Example Data)</h2>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            John Doe
                                        </div>
                                        <div className="text-sm text-gray-500">john@example.com</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            Combined Check
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            15
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="flex items-center text-green-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Clear
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date().toLocaleString()}
                                    </td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            Jane Smith
                                        </div>
                                        <div className="text-sm text-gray-500">jane@example.com</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            Email Check
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            85
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="flex items-center text-red-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z" />
                                            </svg>
                                            Suspicious
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date().toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                */}
            </div>
        </div>
    );
}
