'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, AlertCircle, CheckCircle, X, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface CreditBureauResponse {
  entity: {
    address: string;
    bvn: string;
    dateOfBirth: string;
    email: string;
    gender: string;
    name: string;
    phone: string;
    score: {
      bureauStatus: {
        crc: string;
        creditRegistry: string;
        firstCentral: string;
      };
      creditEnquiries: Array<{
        source: string;
        value: Array<{
          contactPhone: string;
          date: string;
          loanProvider: string;
          reason: string;
        }>;
      }>;
      creditEnquiriesSummary: Array<{
        source: string;
        value: {
          Last12MonthCount: string;
          Last36MonthCount: string;
          Last3MonthCount: string;
        };
      }>;
      loanHistory: Array<{
        source: string;
        value: Array<{
          accountNumber: string;
          dateReported: string;
          installmentAmount: string;
          lastPaymentDate: string;
          loanAmount: string;
          loanDuration: any;
          loanProvider: string;
          outstandingBalance: string;
          overdueAmount: string;
          paymentHistory: any[];
          performanceStatus: string;
          status: string;
          type: string;
        }>;
      }>;
      loanPerformance: Array<{
        source: string;
        value: Array<{
          accountNumber: string;
          loanAmount: number;
          loanCount: number;
          loanProvider: string;
          noOfNonPerforming: number;
          noOfPerforming: number;
          outstandingBalance: number;
          overdueAmount: number;
          performanceStatus: string;
          status: string;
        }>;
      }>;
      totalBorrowed: Array<{
        source: string;
        value: number;
      }>;
      totalMonthlyInstallment: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfActiveLoans: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfClosedLoans: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfDelinquentFacilities: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfInstitutions: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfLoans: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfOverdueAccounts: Array<{
        source: string;
        value: number;
      }>;
      totalNoOfPerformingLoans: Array<{
        source: string;
        value: number;
      }>;
      totalOutstanding: Array<{
        source: string;
        value: number;
      }>;
      totalOverdue: Array<{
        source: string;
        value: number;
      }>;
    };
    searchedDate: string;
  };
}

interface FraudCheckHistory {
  id: string;
  bvn: string;
  userName: string;
  riskScore: number;
  createdAt: string;
  isFraudSuspected: boolean;
  responseData?: any;
  fraudReasons?: string[];
}

export default function CreditBureauCheck() {
  const [bvn, setBvn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditData, setCreditData] = useState<CreditBureauResponse | null>(null);
  const [checkHistory, setCheckHistory] = useState<FraudCheckHistory[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckHistory();
  }, []);
  const fetchCheckHistory = async () => {
    try {
      const response = await fetch('/api/admin/credit-bureau/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credit check history');
      }

      const data = await response.json();
      setCheckHistory(data.history);
    } catch (error) {
      console.error('Error fetching credit check history:', error);
    }
  };

  // Load a previous credit check by its BVN
  const loadPreviousCheck = async (bvn: string) => {
    try {
      setLoading(true);
      setError(null);

      // Filter local history first
      const previousCheck = checkHistory.find(check => check.bvn === bvn);
      if (previousCheck && previousCheck.responseData) {
        // Use the stored response data
        setCreditData(previousCheck.responseData);
        setRiskScore(previousCheck.riskScore);
        setBvn(bvn);

        // Set fraud reasons if available
        if (previousCheck.fraudReasons) {
          setSuccessMessage(`Loaded previous credit check from ${new Date(previousCheck.createdAt).toLocaleDateString()}`);
        }

        console.log('Loaded previous credit check from history');
      } else {
        // If not found locally, try to fetch from the API
        const response = await fetch(`/api/admin/credit-bureau/history?bvn=${bvn}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch previous credit check');
        }

        const data = await response.json();
        if (data.history && data.history.length > 0) {
          const mostRecent = data.history[0];
          setCreditData(mostRecent.responseData);
          setRiskScore(mostRecent.riskScore);
        } else {
          throw new Error('No previous credit checks found for this BVN');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bvn || bvn.length !== 11) {
      setError('Please enter a valid 11-digit BVN');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCreditData(null);
      let response;
      try {
        response = await fetch(`/api/admin/credit-bureau/check?bvn=${bvn}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          // Add browser-side timeout to prevent UI hanging
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError' || (fetchError as Error).name === 'TimeoutError') {
          throw new Error('The request timed out. The credit bureau service may be temporarily unavailable. Please try again later.');
        } else {
          throw new Error(`Network error: ${(fetchError as Error).message}`);
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific error cases with more user-friendly messages
        if (response.status === 424 || errorData?.details?.error === 'Unable to reach service') {
          throw new Error('Credit bureau service is currently unavailable. This is typically a temporary issue with the connection to the credit bureau. Please try again later.');
        } else if (response.status === 404 && errorData?.details?.error === 'No credit data available for this borrower') {
          throw new Error('No credit history found for this BVN. This individual may not have any credit accounts registered with Nigerian credit bureaus.');
        } else if (response.status === 503) {
          throw new Error(errorData?.error || 'Network error: Could not connect to the credit bureau API. Please check your internet connection and try again later.');
        } else {
          throw new Error(errorData?.error || errorData?.suggestion || 'Failed to fetch credit bureau data');
        }
      }

      const data = await response.json();
      setCreditData(data);

      // Calculate risk score based on credit bureau data
      calculateRiskScore(data);

      // Refresh history after new check
      fetchCheckHistory();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = (data: CreditBureauResponse) => {
    // Initial risk score starts at 0 (low risk)
    let score = 0;

    try {
      const { score: creditScore } = data.entity;

      // Check total active loans
      const activeLoans = creditScore.totalNoOfActiveLoans?.[0]?.value || 0;
      if (activeLoans > 5) {
        score += 30; // High risk if many active loans
      } else if (activeLoans > 2) {
        score += 15; // Medium risk
      }

      // Check delinquent facilities
      const delinquentFacilities = creditScore.totalNoOfDelinquentFacilities?.[0]?.value || 0;
      if (delinquentFacilities > 0) {
        score += 35; // High risk if any delinquent facilities
      }

      // Check overdue accounts
      const overdueAccounts = creditScore.totalNoOfOverdueAccounts?.[0]?.value || 0;
      if (overdueAccounts > 0) {
        score += 25; // High risk if any overdue accounts
      }

      // Check credit enquiries in last 3 months
      const creditEnquiries = creditScore.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount || "0";
      if (parseInt(creditEnquiries) > 5) {
        score += 20; // Multiple recent enquiries is suspicious
      }

      // Check loan performance - if any non-performing
      let hasNonPerforming = false;
      creditScore.loanPerformance?.forEach(item => {
        item.value.forEach(loan => {
          if (loan.noOfNonPerforming > 0) {
            hasNonPerforming = true;
          }
        });
      });

      if (hasNonPerforming) {
        score += 30;
      }

      setRiskScore(score);
    } catch (error) {
      console.error('Error calculating risk score:', error);
      setRiskScore(0);
    }
  };

  const saveFraudCheck = async () => {
    if (!creditData || riskScore === null) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/credit-bureau/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bvn: creditData.entity.bvn,
          name: creditData.entity.name,
          riskScore: riskScore,
          isFraudSuspected: riskScore > 50,
          responseData: creditData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save credit check');
      }

      setSuccessMessage('Credit check saved successfully');
      fetchCheckHistory();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'High Risk', color: 'text-red-600' };
    if (score >= 40) return { label: 'Medium Risk', color: 'text-yellow-600' };
    return { label: 'Low Risk', color: 'text-green-600' };
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-4">Credit Bureau Check</h2>
        <p className="text-sm text-gray-600 mb-4">
          Use the BVN to check a user's credit history and detect potential fraud indicators.
        </p>

        {/* BVN Search Form */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
                placeholder="Enter BVN Number (11 digits)"
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                pattern="[0-9]{11}"
                maxLength={11}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || bvn.length !== 11}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Credit'}
          </button>
        </form>


        {/* Credit data display */}
        {creditData && (
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">{creditData.entity.name}</h3>
                <p className="text-gray-500 text-sm">BVN: {creditData.entity.bvn}</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getRiskLevel(riskScore || 0).color}`}>
                  {getRiskLevel(riskScore || 0).label}
                </div>
                <div className="text-sm text-gray-500">
                  Score: {riskScore !== null ? riskScore : 'Calculating...'}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => saveFraudCheck()}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Check Results'}
              </button>
            </div>

            {/* Fraud Detection Summary */}
            <div className="mt-6">
              <div className={`border rounded-lg overflow-hidden ${riskScore && riskScore > 30 ? 'border-red-200' : 'border-gray-200'}`}>
                <div className={`p-4 flex justify-between items-center ${riskScore && riskScore > 50 ? 'bg-red-50' : riskScore && riskScore > 30 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <div className="flex items-center">
                    {riskScore && riskScore > 50 ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    ) : riskScore && riskScore > 30 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    )}
                    <h4 className="font-medium">Fraud Detection Summary</h4>
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Risk Assessment Result</div>
                      <div className={`text-sm font-bold ${riskScore && riskScore > 50 ? 'text-red-600' : riskScore && riskScore > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {riskScore && riskScore > 50 ? 'High Risk' : riskScore && riskScore > 30 ? 'Medium Risk' : 'Low Risk'}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${riskScore && riskScore > 50 ? 'bg-red-500' : riskScore && riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${riskScore || 0}%` }}></div>
                    </div>
                  </div>

                  <h5 className="font-medium mb-2">Detected Issues:</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {/* Generate list based on risk factors */}
                    {creditData.entity.score.totalNoOfActiveLoans?.[0]?.value > 5 && (
                      <li className="text-red-600">Multiple active loans ({creditData.entity.score.totalNoOfActiveLoans?.[0]?.value}) - High risk indicator</li>
                    )}

                    {creditData.entity.score.totalNoOfDelinquentFacilities?.[0]?.value > 0 && (
                      <li className="text-red-600">Has {creditData.entity.score.totalNoOfDelinquentFacilities?.[0]?.value} delinquent facilities</li>
                    )}

                    {creditData.entity.score.totalNoOfOverdueAccounts?.[0]?.value > 0 && (
                      <li className="text-red-600">Has {creditData.entity.score.totalNoOfOverdueAccounts?.[0]?.value} overdue accounts</li>
                    )}

                    {creditData.entity.score.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount && parseInt(creditData.entity.score.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount) > 5 && (
                      <li className="text-yellow-600">Multiple recent credit enquiries ({creditData.entity.score.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount} in last 3 months)</li>
                    )}

                    {(() => {
                      // Check for non-performing loans
                      let nonPerformingCount = 0;
                      creditData.entity.score.loanPerformance?.forEach((item: any) => {
                        item.value.forEach((loan: any) => {
                          if (loan.noOfNonPerforming > 0) {
                            nonPerformingCount += loan.noOfNonPerforming;
                          }
                        });
                      });

                      if (nonPerformingCount > 0) {
                        return <li className="text-red-600">{nonPerformingCount} non-performing loans detected</li>;
                      }
                      return null;
                    })()}

                    {/* If no issues detected */}
                    {!creditData.entity.score.totalNoOfDelinquentFacilities?.[0]?.value &&
                      !creditData.entity.score.totalNoOfOverdueAccounts?.[0]?.value &&
                      !(parseInt(creditData.entity.score.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount || "0") > 5) && (
                        <li className="text-green-600">No significant credit risk indicators detected</li>
                      )}
                  </ul>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium mb-2">Recommendation:</h5>
                    <p className={`${riskScore && riskScore > 50 ? 'text-red-600' : riskScore && riskScore > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {riskScore && riskScore > 50
                        ? 'High risk profile detected. Recommend additional verification and manual review before approval.'
                        : riskScore && riskScore > 30
                          ? 'Medium risk profile detected. Consider additional verification steps.'
                          : 'Low risk profile. Standard verification procedures should be sufficient.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Profile Summary Section */}
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('summary')}
                >
                  <h4 className="font-medium">Profile Summary</h4>
                  {expandedSection === 'summary' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {expandedSection === 'summary' && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{creditData.entity.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p className="font-medium">{creditData.entity.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="font-medium">{creditData.entity.dateOfBirth || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">{creditData.entity.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{creditData.entity.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{creditData.entity.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Credit Summary Section */}
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('creditSummary')}
                >
                  <h4 className="font-medium">Credit Summary</h4>
                  {expandedSection === 'creditSummary' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {expandedSection === 'creditSummary' && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium mb-2">Loan Summary</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Loans:</span>
                            <span className="font-medium">
                              {creditData.entity.score.totalNoOfLoans?.[0]?.value || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Active Loans:</span>
                            <span className="font-medium">
                              {creditData.entity.score.totalNoOfActiveLoans?.[0]?.value || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Closed Loans:</span>
                            <span className="font-medium">
                              {creditData.entity.score.totalNoOfClosedLoans?.[0]?.value || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Institutions:</span>
                            <span className="font-medium">
                              {creditData.entity.score.totalNoOfInstitutions?.[0]?.value || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium mb-2">Financial Status</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Borrowed:</span>
                            <span className="font-medium">
                              ₦{creditData.entity.score.totalBorrowed?.[0]?.value?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Outstanding:</span>
                            <span className="font-medium">
                              ₦{creditData.entity.score.totalOutstanding?.[0]?.value?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Monthly Payment:</span>
                            <span className="font-medium">
                              ₦{creditData.entity.score.totalMonthlyInstallment?.[0]?.value?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Overdue:</span>
                            <span className={`font-medium ${creditData.entity.score.totalOverdue?.[0]?.value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₦{creditData.entity.score.totalOverdue?.[0]?.value?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium mb-2">Risk Indicators</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Performing Loans:</span>
                            <span className="font-medium text-green-600">
                              {creditData.entity.score.totalNoOfPerformingLoans?.[0]?.value || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Delinquent:</span>
                            <span className="font-medium text-red-600">
                              {creditData.entity.score.totalNoOfDelinquentFacilities?.[0]?.value || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Overdue Accounts:</span>
                            <span className="font-medium text-red-600">
                              {creditData.entity.score.totalNoOfOverdueAccounts?.[0]?.value || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Recent Enquiries:</span>
                            <span className="font-medium">
                              {creditData.entity.score.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Loan History Section */}
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('loanHistory')}
                >
                  <h4 className="font-medium">Loan History</h4>
                  {expandedSection === 'loanHistory' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {expandedSection === 'loanHistory' && (
                  <div className="p-4 bg-white overflow-x-auto">
                    {creditData.entity.score.loanHistory?.length > 0 && creditData.entity.score.loanHistory[0].value.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Reported</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {creditData.entity.score.loanHistory[0].value.map((loan, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {loan.loanProvider}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {loan.type || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₦{parseInt(loan.loanAmount || '0').toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {loan.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.performanceStatus === 'Performing' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {loan.performanceStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {loan.dateReported}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-500">No loan history found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loan Performance Section */}
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('loanPerformance')}
                >
                  <h4 className="font-medium">Loan Performance</h4>
                  {expandedSection === 'loanPerformance' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {expandedSection === 'loanPerformance' && (
                  <div className="p-4 bg-white overflow-x-auto">
                    {creditData.entity.score.loanPerformance?.length > 0 && creditData.entity.score.loanPerformance[0].value.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {creditData.entity.score.loanPerformance[0].value.map((loan, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {loan.loanProvider}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₦{loan.loanAmount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {loan.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.performanceStatus === 'Performing' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {loan.performanceStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₦{loan.outstandingBalance.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₦{loan.overdueAmount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-500">No loan performance data found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Credit Enquiries Section */}
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('creditEnquiries')}
                >
                  <h4 className="font-medium">Credit Enquiries</h4>
                  {expandedSection === 'creditEnquiries' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {expandedSection === 'creditEnquiries' && (
                  <div className="p-4 bg-white">
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2">Enquiry Summary</h5>
                      {creditData.entity.score.creditEnquiriesSummary?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600">
                                {creditData.entity.score.creditEnquiriesSummary[0].value?.Last3MonthCount || '0'}
                              </div>
                              <div className="text-xs text-gray-500">Last 3 Months</div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600">
                                {creditData.entity.score.creditEnquiriesSummary[0].value?.Last12MonthCount || '0'}
                              </div>
                              <div className="text-xs text-gray-500">Last 12 Months</div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600">
                                {creditData.entity.score.creditEnquiriesSummary[0].value?.Last36MonthCount || '0'}
                              </div>
                              <div className="text-xs text-gray-500">Last 36 Months</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-gray-500">No enquiry summary found</p>
                        </div>
                      )}
                    </div>

                    <h5 className="text-sm font-medium mb-2 mt-4">Recent Enquiries</h5>
                    {creditData.entity.score.creditEnquiries?.length > 0 &&
                      creditData.entity.score.creditEnquiries[0].value?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {creditData.entity.score.creditEnquiries[0].value.map((enquiry, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {enquiry.loanProvider}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(enquiry.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {enquiry.reason || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {enquiry.contactPhone || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-500">No recent enquiries found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Previous check history */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Previous Credit Checks History</h3>
          {checkHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BVN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checkHistory.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {check.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {check.bvn.substr(0, 4) + '****' + check.bvn.substr(-3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${check.riskScore >= 70 ? 'bg-red-100 text-red-800' :
                            check.riskScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'}`}>
                          {check.riskScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center ${check.isFraudSuspected ? 'text-red-600' : 'text-green-600'}`}>
                          {check.isFraudSuspected ? (
                            <>
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Suspicious
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Clear
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(check.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <button
                          onClick={() => loadPreviousCheck(check.bvn)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No previous credit checks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
      );
}
