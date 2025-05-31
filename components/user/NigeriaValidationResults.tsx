// components/user/NigeriaValidationResults.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface ValidationResult {
  type: string;
  status: string;
  isMatch: boolean;
  confidence?: number;
  data?: any;
  errorMessage?: string;
  timestamp: string;
}

interface NigeriaValidationProps {
  userId: string;
}

export default function NigeriaValidationResults({ userId }: NigeriaValidationProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchValidationResults();
  }, [userId]);

  const fetchValidationResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/nigeria-validation?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch validation results');
      }
      
      const data = await response.json();
      setValidationResults(data.validations || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async () => {
    setRefreshing(true);
    await fetchValidationResults();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string, isMatch?: boolean) => {
    if (status === 'SUCCESS' && isMatch) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'SUCCESS' && !isMatch) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (status === 'PENDING') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, isMatch?: boolean) => {
    if (status === 'SUCCESS' && isMatch) {
      return 'bg-green-50 text-green-800 border-green-200';
    } else if (status === 'SUCCESS' && !isMatch) {
      return 'bg-red-50 text-red-800 border-red-200';
    } else if (status === 'PENDING') {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getValidationTypeIcon = (type: string) => {
    switch (type) {
      case 'BVN_LOOKUP':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'NIN_LOOKUP':
        return <User className="h-5 w-5 text-purple-600" />;
      case 'PASSPORT_LOOKUP':
      case 'DRIVERS_LICENSE_LOOKUP':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getValidationTitle = (type: string) => {
    switch (type) {
      case 'BVN_LOOKUP':
        return 'Bank Verification Number (BVN)';
      case 'NIN_LOOKUP':
        return 'National Identification Number (NIN)';
      case 'PASSPORT_LOOKUP':
        return 'Nigerian Passport';
      case 'DRIVERS_LICENSE_LOOKUP':
        return 'Driver\'s License';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const maskSensitiveData = (data: any, key: string) => {
    if (!showSensitiveData && ['bvn', 'nin', 'phone', 'email'].includes(key.toLowerCase())) {
      const str = String(data);
      if (str.length > 4) {
        return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
      }
    }
    return data;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Validation Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchValidationResults}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nigeria Identity Validation</h2>
              <p className="text-sm text-gray-600">
                Verification status of your Nigerian identity documents
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showSensitiveData ? 'Hide' : 'Show'} Details</span>
            </button>
            
            <button
              onClick={refreshResults}
              disabled={refreshing}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {validationResults.filter(v => v.status === 'SUCCESS' && v.isMatch).length}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {validationResults.filter(v => v.status === 'SUCCESS' && !v.isMatch).length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {validationResults.filter(v => v.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {validationResults.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      <div className="space-y-4">
        {validationResults.map((result, index) => (
          <div key={index} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getValidationTypeIcon(result.type)}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getValidationTitle(result.type)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(result.timestamp).toLocaleDateString()} at{' '}
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(result.status, result.isMatch)}
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status, result.isMatch)}`}>
                  {result.status === 'SUCCESS' ? (result.isMatch ? 'Verified' : 'Mismatch') : result.status}
                </span>
              </div>
            </div>

            {/* Confidence Score */}
            {result.confidence && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Confidence Score</span>
                  <span className="text-sm font-medium">{result.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      result.confidence >= 80 ? 'bg-green-500' : 
                      result.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.confidence}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Data Display */}
            {result.data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Verification Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {Object.entries(result.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium text-gray-900">
                        {maskSensitiveData(value, key)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {result.errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-800">{result.errorMessage}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {validationResults.length === 0 && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Results</h3>
          <p className="text-gray-600">
            Identity validation will begin once you upload your documents.
          </p>
        </div>
      )}
    </div>
  );
}