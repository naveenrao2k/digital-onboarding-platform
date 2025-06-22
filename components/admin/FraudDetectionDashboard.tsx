'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

type FraudDetection = {
    id: string;
    userId: string;
    verificationType: string;
    ipAddress?: string;
    emailAddress?: string;
    phoneNumber?: string;
    bvn?: string;
    riskScore?: number;
    isFraudSuspected: boolean;
    createdAt: string;
    user: {
        email: string;
        firstName: string;
        lastName: string;
    };
    detectionDetails: any;
    responseData?: any;
};

export default function FraudDetectionDashboard() {
    const [fraudDetections, setFraudDetections] = useState<FraudDetection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null); useEffect(() => {
        const fetchFraudDetections = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/admin/fraud-checks', {
                    credentials: 'include', // Include cookies with the request
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Unauthorized: Please login as an admin');
                    }
                    throw new Error('Failed to fetch fraud detections');
                }

                const data = await response.json();
                setFraudDetections(data.fraudDetections);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error occurred');
                console.error('Error fetching fraud detections:', error);

                // In development mode, provide sample data for preview
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Using sample fraud detection data for development'); setFraudDetections([
                        {
                            id: 'sample-1',
                            userId: 'user-1',
                            verificationType: 'COMBINED_CHECK',
                            ipAddress: '192.168.1.1',
                            phoneNumber: '+2348012345678',
                            riskScore: 25,
                            isFraudSuspected: false,
                            createdAt: new Date().toISOString(),
                            user: {
                                email: 'user1@example.com',
                                firstName: 'Sample',
                                lastName: 'User'
                            },
                            detectionDetails: {
                                summary: {
                                    ipCheck: 'COMPLETED',
                                    phoneCheck: 'COMPLETED'
                                },
                                ipCheck: {
                                    entity: {
                                        report: {
                                            risk_score: { result: 20 }
                                        }
                                    }
                                },
                                phoneCheck: {
                                    entity: {
                                        score: 30,
                                        disposable: false
                                    }
                                }
                            }
                        },
                        {
                            id: 'sample-2',
                            userId: 'user-2',
                            verificationType: 'COMBINED_CHECK',
                            ipAddress: '42.107.194.30',
                            riskScore: 65,
                            isFraudSuspected: false,
                            createdAt: new Date().toISOString(),
                            user: {
                                email: 'user2@example.com',
                                firstName: 'Test',
                                lastName: 'User'
                            },
                            detectionDetails: {
                                summary: {
                                    ipCheck: 'COMPLETED',
                                    phoneCheck: 'NOT_PROVIDED'
                                },
                                ipCheck: {
                                    entity: {
                                        report: {
                                            risk_score: { result: 65 }
                                        }
                                    }
                                }
                            }
                        }
                    ]);
                    setError(null);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFraudDetections();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getRiskColor = (score?: number) => {
        if (!score && score !== 0) return 'bg-gray-200';
        if (score < 30) return 'bg-green-100 text-green-800';
        if (score < 70) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }; const getVerificationTypeLabel = (type: string) => {
        switch (type) {
            case 'IP_CHECK': return 'IP Address Check';
            case 'PHONE_CHECK': return 'Phone Number Check';
            case 'COMBINED_CHECK': return 'IP & Phone Check';
            default: return type;
        }
    };

    if (loading) {
        return <div className="flex justify-center py-10">Loading fraud detection data...</div>;
    } if (error) {
        return (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg my-4">
                <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="font-medium">Error: {error}</p>
                    </div>

                    {error.includes('Unauthorized') && (
                        <div className="mt-2 pl-7 text-sm">
                            <p>Please make sure you are logged in as an admin.</p>
                            <p className="mt-1">
                                <a href="/admin/login" className="text-blue-600 hover:text-blue-800 underline">
                                    Go to admin login
                                </a>
                            </p>
                            {process.env.NODE_ENV !== 'production' && (
                                <p className="mt-2 text-gray-600">
                                    <span className="font-medium">Development credential:</span><br />
                                    Email: admin@example.com<br />
                                    Password: admin123
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    } return (
        <div>
            

            <div className="bg-white shadow rounded-lg">

                {fraudDetections.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No fraud detection checks have been performed yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y ">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {fraudDetections.map((detection) => (
                                    <React.Fragment key={detection.id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {detection.user.firstName} {detection.user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">{detection.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {getVerificationTypeLabel(detection.verificationType)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(detection.riskScore)}`}>
                                                    {detection.riskScore !== undefined ? detection.riskScore : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {detection.isFraudSuspected ? (
                                                    <span className="flex items-center text-red-600">
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        Suspicious
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-green-600">
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Clear
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(detection.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => toggleExpand(detection.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                                >
                                                    {expandedId === detection.id ? (
                                                        <>
                                                            Hide <ChevronUp className="h-4 w-4 ml-1" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            View <ChevronDown className="h-4 w-4 ml-1" />
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedId === detection.id && (
                                            <tr className='max-w-[4xl]'>
                                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                    <div className="text-sm">
                                                        <h3 className="font-semibold mb-2">Detection Details</h3>                                                {detection.verificationType === 'COMBINED_CHECK' && detection.detectionDetails?.summary ? (<div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                                                                <div className="border rounded-md p-3">
                                                                <h4 className="font-medium mb-2">IP Check</h4>
                                                                <div className="flex items-center">
                                                                    <span className={`inline-block w-3 h-3 rounded-full ${detection.detectionDetails?.summary?.ipCheck === 'COMPLETED' ? 'bg-green-500' :
                                                                        detection.detectionDetails?.summary?.ipCheck === 'FAILED' || detection.detectionDetails?.ipCheck?.error ? 'bg-red-500' :
                                                                            'bg-gray-500'
                                                                        } mr-2`}></span>
                                                                    <span>
                                                                        {detection.detectionDetails?.ipCheck?.error
                                                                            ? 'Error'
                                                                            : detection.detectionDetails?.summary?.ipCheck || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 text-xs text-gray-500">
                                                                    <strong>IP Address:</strong> {detection.ipAddress || 'Not recorded'}
                                                                </div>
                                                                {detection.detectionDetails?.ipCheck?.error ? (
                                                                    <div className="mt-1 text-xs text-red-600">
                                                                        <strong>Error:</strong> {detection.detectionDetails.ipCheck.error}
                                                                    </div>
                                                                ) : detection.detectionDetails?.ipCheck?.entity?.report?.risk_score?.result !== undefined && (
                                                                    <div className="mt-1 text-xs">
                                                                        <strong>Risk Score:</strong> <span className={`font-medium ${detection.detectionDetails.ipCheck.entity.report.risk_score.result > 70 ? 'text-red-600' : detection.detectionDetails.ipCheck.entity.report.risk_score.result > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                            {detection.detectionDetails.ipCheck.entity.report.risk_score.result}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>                                                                <div className="border rounded-md p-3">
                                                                    <h4 className="font-medium mb-2">Phone Check</h4>
                                                                    <div className="flex items-center">
                                                                        <span className={`inline-block w-3 h-3 rounded-full ${detection.detectionDetails?.summary?.phoneCheck === 'COMPLETED' ? 'bg-green-500' :
                                                                            detection.detectionDetails?.summary?.phoneCheck === 'NOT_PROVIDED' ? 'bg-yellow-500' :
                                                                                detection.detectionDetails?.summary?.phoneCheck === 'ERROR' || detection.detectionDetails?.phoneCheck?.error ? 'bg-red-500' :
                                                                                    'bg-gray-500'
                                                                            } mr-2`}></span>
                                                                        <span>
                                                                            {detection.detectionDetails?.summary?.phoneCheck === 'NOT_PROVIDED'
                                                                                ? 'Phone number not provided'
                                                                                : detection.detectionDetails?.phoneCheck?.error
                                                                                    ? 'Error'
                                                                                    : detection.detectionDetails?.summary?.phoneCheck === 'COMPLETED'
                                                                                        ? 'Completed'
                                                                                        : detection.detectionDetails?.summary?.phoneCheck === 'ERROR'
                                                                                            ? 'Error processing'
                                                                                            : 'Unknown status'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-gray-500">
                                                                        <strong>Phone Number:</strong> {detection.phoneNumber || 'Not provided'}
                                                                    </div>
                                                                    {detection.detectionDetails?.phoneCheck?.error ? (
                                                                        <div className="mt-1 text-xs text-red-600">
                                                                            <strong>Error:</strong> {detection.detectionDetails.phoneCheck.error}
                                                                        </div>
                                                                    ) : detection.phoneNumber && detection.detectionDetails?.phoneCheck?.entity?.score !== undefined && (
                                                                        <div className="mt-1 text-xs">
                                                                            <strong>Risk Score:</strong> <span className={`font-medium ${detection.detectionDetails.phoneCheck.entity.score > 70 ? 'text-red-600' : detection.detectionDetails.phoneCheck.entity.score > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                                {detection.detectionDetails.phoneCheck.entity.score}
                                                                            </span>
                                                                            {detection.detectionDetails.phoneCheck.entity.disposable && (
                                                                                <span className="ml-2 px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                                                                                    Disposable
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>                                                            
                                                            {/* Final Fraud Analysis Section */}
                                                            <div className="border rounded-md p-3 mt-4 bg-gray-50">
                                                                <h4 className="font-medium mb-2">Fraud Analysis Summary</h4>
                                                                <div className="flex justify-between">
                                                                    <div className="flex items-center">
                                                                        {detection.isFraudSuspected ? (
                                                                            <>
                                                                                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                                                                <span className="font-medium text-red-600">Potentially Fraudulent Activity</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                                <span className="font-medium text-green-600">No Fraud Detected</span>
                                                                            </>
                                                                        )}
                                                                    </div>                                                                    <div className={`px-2 py-1 text-xs rounded-full font-medium ${(detection.riskScore || 0) > 70 ? 'bg-red-100 text-red-800' :
                                                                            (detection.riskScore || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-green-100 text-green-800'}`}>
                                                                        Final Risk Score: {detection.riskScore || 0}
                                                                    </div>
                                                                </div>
                                                                {/* Fraud Reasons if any */}
                                                                {detection.detectionDetails?.fraudReasons &&
                                                                    Array.isArray(detection.detectionDetails.fraudReasons) &&
                                                                    detection.detectionDetails.fraudReasons.length > 0 && (
                                                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                                                            <h5 className="text-xs font-medium mb-1">Detected Issues:</h5>
                                                                            <ul className="list-disc pl-4 text-xs">
                                                                                {detection.detectionDetails.fraudReasons.map((reason: string, idx: number) => (
                                                                                    <li key={idx} className="text-red-600 mb-1">{reason}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            <h4 className="font-medium mt-4">Raw Detection Details</h4>
                                                            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96  text-xs">
                                                                {JSON.stringify(detection.detectionDetails, null, 2)}
                                                            </pre>
                                                        </div>
                                                        ) : detection.verificationType === 'CREDIT_CHECK' ? (
                                                            <div>
                                                                <div className="border rounded-md p-4 mb-4 bg-white">
                                                                    <h4 className="font-medium mb-2">Credit Bureau Check</h4>

                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <div className="flex items-center">
                                                                            {detection.isFraudSuspected ? (
                                                                                <>
                                                                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                                                                    <span className="font-medium text-red-600">Potential Fraud Detected</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                                                                    <span className="font-medium text-green-600">No Fraud Detected</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div>                                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${(detection.riskScore || 0) > 70 ? 'bg-red-100 text-red-800' :
                                                                                (detection.riskScore || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-green-100 text-green-800'}`}>
                                                                            Risk Score: {detection.riskScore || 0}
                                                                        </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* BVN Info */}
                                                                    <div className="mb-3">
                                                                        <p className="text-sm"><strong>BVN:</strong> {detection.bvn || 'Not recorded'}</p>
                                                                        <p className="text-sm"><strong>Check Date:</strong> {new Date(detection.createdAt).toLocaleString()}</p>
                                                                    </div>
                                                                    {/* Fraud Reasons */}
                                                                    {detection.detectionDetails?.fraudReasons &&
                                                                        Array.isArray(detection.detectionDetails.fraudReasons) &&
                                                                        detection.detectionDetails.fraudReasons.length > 0 && (
                                                                            <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                                                                                <h5 className="font-medium text-sm mb-2 text-red-700">Fraud Indicators:</h5>
                                                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                                                    {detection.detectionDetails.fraudReasons.map((reason: string, idx: number) => (
                                                                                        <li key={idx} className="text-red-600">{reason}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                </div>

                                                                <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96 text-xs max-w-4xl  2xl:max-w-6xl">
                                                                    {JSON.stringify(detection.responseData || detection.detectionDetails || {}, null, 2)}
                                                                </pre>
                                                            </div>
                                                        ) : (
                                                            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96 text-xs ">
                                                                {JSON.stringify(detection.detectionDetails, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>                </div>
                )}
            </div>
        </div>
    );
}
