'use client';

import { useState, useRef } from 'react';
import { FileText, UploadCloud, AlertCircle, CheckCircle2, Loader2, Download, RefreshCw, AlertTriangle, Info, FileQuestion } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';

// Interface for the fraud detection results
interface FraudDetectionResult {
  totalTransactions: number;
  suspiciousTransactions: number;
  overallRiskScore: number;
  findings: {
    type: 'Anomaly' | 'Pattern' | 'Fraud';
    description: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    affectedCount: number;
    affectedIds?: string[];
  }[];
  transactionDetails?: {
    suspiciousTransactions: {
      id: string;
      amount: number;
      date: string;
      merchant: string;
      accountId: string;
      fraudType: string;
      riskScore: number;
    }[];
    topRiskMerchants?: {
      merchant: string;
      count: number;
      totalAmount: number;
    }[];
  };
  loanEligibility?: {
    isEligible: boolean;
    score: number; // 0-100 credit score
    maxLoanAmount?: number;
    reasonCodes: {
      code: string;
      description: string;
      impact: 'positive' | 'negative' | 'neutral';
    }[];
    accountAnalysis: {
      accountId: string;
      averageBalance: number;
      cashFlowStability: 'stable' | 'moderate' | 'unstable';
      transactionVelocity: 'high' | 'medium' | 'low';
      riskLevel: 'low' | 'medium' | 'high';
    }[];
  };
}

// This component handles transaction data analysis for fraud detection
export default function TransactionAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [results, setResults] = useState<FraudDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showTrendModal, setShowTrendModal] = useState(false);

  const getRiskDistributionData = (findings: FraudDetectionResult['findings']) => {
    const distribution = {
      'High': 0,
      'Medium': 0,
      'Low': 0
    };

    findings.forEach(finding => {
      distribution[finding.riskLevel] += finding.affectedCount;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const getMerchantVolumeData = (transactions: { id: string; amount: number; date: string; merchant: string; accountId: string; fraudType: string; riskScore: number; }[] | undefined) => {
    if (!transactions) return [];

    const merchantVolume: Record<string, { count: number, amount: number }> = {};
    transactions.forEach((tx) => {
      if (!merchantVolume[tx.merchant]) {
        merchantVolume[tx.merchant] = { count: 0, amount: 0 };
      }
      merchantVolume[tx.merchant].count += 1;
      merchantVolume[tx.merchant].amount += tx.amount;
    });

    return Object.entries(merchantVolume)
      .map(([merchant, data]) => ({
        merchant,
        transactions: data.count,
        amount: data.amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const getRiskScoreTrendData = (transactions: { id: string; amount: number; date: string; merchant: string; accountId: string; fraudType: string; riskScore: number; }[] | undefined) => {
    if (!transactions) return [];

    // Sort by date
    return [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)
      .map((tx, index) => ({
        index: index + 1,
        date: tx.date.split('T')[0],
        riskScore: tx.riskScore,
        amount: tx.amount
      }));
  };

  const getAccountBalanceData = (accounts: { accountId: string; averageBalance: number; cashFlowStability: 'stable' | 'moderate' | 'unstable'; transactionVelocity: 'high' | 'medium' | 'low'; riskLevel: 'low' | 'medium' | 'high'; }[] | undefined) => {
    if (!accounts) return [];

    return accounts.map((account) => ({
      accountId: account.accountId,
      balance: account.averageBalance,
      risk: account.riskLevel === 'high' ? 3 : account.riskLevel === 'medium' ? 2 : 1
    }));
  };

  const getFraudTypeDistribution = (transactions: { id: string; amount: number; date: string; merchant: string; accountId: string; fraudType: string; riskScore: number; }[] | undefined) => {
    if (!transactions) return [];

    const distribution: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (!distribution[tx.fraudType]) {
        distribution[tx.fraudType] = 0;
      }
      distribution[tx.fraudType] += 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  // Chart colors
  const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Green, Amber, Red
  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16'];

  const resetAnalysis = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setShowUploadSection(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const generateReport = () => {
    if (!results) return;

    try {
      setIsGeneratingPdf(true);

      // Format the current date for the filename
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Create a filename with date and account info if available
      let accounts = 'unknown';
      if (results.loanEligibility?.accountAnalysis?.length) {
        accounts = results.loanEligibility.accountAnalysis.map(a => a.accountId).join('-');
      }

      const fileName = `fraud-analysis-${dateStr}-${accounts}.html`;

      // Generate HTML content
      let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #1e3fa8; margin-bottom: 5px; }
          h2 { color: #2c5282; margin-top: 30px; margin-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; font-size: 0.9em; }
          .summary-box { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
          .metric { flex: 1; min-width: 200px; padding: 15px; border-radius: 5px; border: 1px solid #ddd; }
          .metric-title { font-size: 0.9em; color: #666; margin-bottom: 5px; }
          .metric-value { font-size: 1.5em; font-weight: bold; }
          .high { color: #e53e3e; }
          .medium { color: #dd6b20; }
          .low { color: #2f855a; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8fafc; text-align: left; padding: 10px; }
          td { border-top: 1px solid #edf2f7; padding: 10px; }
          tr:hover { background-color: #f8fafc; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: bold; }
          .badge-red { background: #fed7d7; color: #9b2c2c; }
          .badge-amber { background: #feebc8; color: #9c4221; }
          .badge-green { background: #c6f6d5; color: #2f855a; }
          .badge-blue { background: #bee3f8; color: #2c5282; }
          .eligibility-section { margin-top: 30px; padding: 20px; border-radius: 5px; border: 1px solid #ddd; }
          .factors-list { list-style-type: none; padding: 0; }
          .factor-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
          .factor-item:before { content: ""; position: absolute; left: 0; top: 8px; width: 10px; height: 10px; border-radius: 50%; }
          .factor-positive:before { background-color: #38a169; }
          .factor-negative:before { background-color: #e53e3e; }
          .factor-neutral:before { background-color: #718096; }
        </style>
      </head>
      <body>
        <h1>Transaction Analysis Report</h1>
        <div class="meta">
          <div>Generated: ${now.toLocaleString()}</div>
          <div>Filename: ${file?.name || 'Unknown file'}</div>
        </div>
        
        <h2>Analysis Summary</h2>
        <div class="summary-box">
          <div class="metric">
            <div class="metric-title">Total Transactions</div>
            <div class="metric-value">${results.totalTransactions}</div>
          </div>
          <div class="metric">
            <div class="metric-title">Suspicious Transactions</div>
            <div class="metric-value ${results.suspiciousTransactions > results.totalTransactions * 0.1 ? 'high' : 'medium'}">
              ${results.suspiciousTransactions}
            </div>
          </div>
          <div class="metric">
            <div class="metric-title">Fraud Risk Score</div>
            <div class="metric-value ${results.overallRiskScore > 65 ? 'high' :
          results.overallRiskScore > 35 ? 'medium' : 'low'
        }">${results.overallRiskScore}</div>
          </div>
        </div>
      `;

      // Add detailed findings section
      if (results.findings?.length > 0) {
        htmlContent += `
        <h2>Detailed Findings</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Risk Level</th>
              <th>Affected Transactions</th>
            </tr>
          </thead>
          <tbody>
        `;

        results.findings.forEach(finding => {
          const badgeClass =
            finding.type === 'Anomaly' ? 'badge-amber' :
              finding.type === 'Pattern' ? 'badge-blue' :
                'badge-red';

          const riskBadgeClass =
            finding.riskLevel === 'Low' ? 'badge-green' :
              finding.riskLevel === 'Medium' ? 'badge-amber' :
                'badge-red';

          htmlContent += `
            <tr>
              <td><span class="badge ${badgeClass}">${finding.type}</span></td>
              <td>${finding.description}</td>
              <td><span class="badge ${riskBadgeClass}">${finding.riskLevel}</span></td>
              <td>${finding.affectedCount}</td>
            </tr>
          `;
        });

        htmlContent += `
          </tbody>
        </table>
        `;
      }

      // Add suspicious transactions section
      if (results.transactionDetails?.suspiciousTransactions?.length) {
        htmlContent += `
        <h2>Suspicious Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Account</th>
              <th>Merchant</th>
              <th>Fraud Type</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
        `;

        results.transactionDetails.suspiciousTransactions.forEach(tx => {
          const riskBadgeClass =
            tx.riskScore > 75 ? 'badge-red' :
              tx.riskScore > 50 ? 'badge-amber' :
                'badge-blue';

          htmlContent += `
            <tr>
              <td>${tx.id}</td>
              <td>${tx.date}</td>
              <td>$${tx.amount.toFixed(2)}</td>
              <td>${tx.accountId}</td>
              <td>${tx.merchant}</td>
              <td><span class="badge badge-red">${tx.fraudType}</span></td>
              <td><span class="badge ${riskBadgeClass}">${tx.riskScore}</span></td>
            </tr>
          `;
        });

        htmlContent += `
          </tbody>
        </table>
        `;
      }

      // Add loan eligibility section if available
      if (results.loanEligibility) {
        const isEligible = results.loanEligibility.isEligible;
        const eligibilityClass = isEligible ? 'low' : 'high';
        const scoreClass =
          results.loanEligibility.score > 75 ? 'low' :
            results.loanEligibility.score > 50 ? 'medium' : 'high';

        htmlContent += `
        <h2>Loan Eligibility Assessment</h2>
        <div class="eligibility-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 5px;" class="${eligibilityClass}">
                ${isEligible ? 'Eligible for Loan' : 'Not Eligible for Loan'}
              </div>
              <div style="color: #666;">Based on transaction history and risk analysis</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 2em; font-weight: bold;" class="${scoreClass}">${results.loanEligibility.score}</div>
              <div style="color: #666;">Credit Score</div>
            </div>
          </div>
        `;

        // Add maximum loan amount if eligible
        if (isEligible && results.loanEligibility.maxLoanAmount) {
          htmlContent += `
          <div style="background: #ebf8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <div style="color: #2c5282;">Recommended Maximum Loan Amount</div>
            <div style="font-size: 1.5em; font-weight: bold; color: #2b6cb0;">
              $${results.loanEligibility.maxLoanAmount.toLocaleString()}
            </div>
          </div>
          `;
        }

        // Add reason codes
        htmlContent += `
          <div style="margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 10px;">Eligibility Factors</h3>
            <ul class="factors-list">
        `;

        results.loanEligibility.reasonCodes.forEach(reason => {
          const factorClass =
            reason.impact === 'positive' ? 'factor-positive' :
              reason.impact === 'negative' ? 'factor-negative' : 'factor-neutral';

          htmlContent += `
            <li class="factor-item ${factorClass}">
              <strong>${reason.code}</strong>: ${reason.description}
            </li>
          `;
        });

        htmlContent += `
            </ul>
          </div>
        `;

        // Add account analysis table
        if (results.loanEligibility.accountAnalysis?.length) {
          htmlContent += `
          <h3 style="margin-bottom: 10px;">Account Analysis</h3>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Avg. Balance</th>
                <th>Cash Flow</th>
                <th>Transaction Velocity</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
          `;

          results.loanEligibility.accountAnalysis.forEach(account => {
            const cashFlowClass =
              account.cashFlowStability === 'stable' ? 'badge-green' :
                account.cashFlowStability === 'moderate' ? 'badge-amber' : 'badge-red';

            const velocityClass =
              account.transactionVelocity === 'low' ? 'badge-green' :
                account.transactionVelocity === 'medium' ? 'badge-amber' : 'badge-red';

            const riskClass =
              account.riskLevel === 'low' ? 'badge-green' :
                account.riskLevel === 'medium' ? 'badge-amber' : 'badge-red';

            htmlContent += `
              <tr>
                <td>${account.accountId}</td>
                <td>$${account.averageBalance.toLocaleString()}</td>
                <td><span class="badge ${cashFlowClass}">${account.cashFlowStability}</span></td>
                <td><span class="badge ${velocityClass}">${account.transactionVelocity}</span></td>
                <td><span class="badge ${riskClass}">${account.riskLevel}</span></td>
              </tr>
            `;
          });

          htmlContent += `
            </tbody>
          </table>
          `;
        }

        htmlContent += `
        </div>
        `;
      }
      // Add visual analytics insights section
      htmlContent += `
        <h2>Visual Analytics Insights</h2>
        <div style="margin-bottom: 30px;">
          <p style="color: #555; margin-bottom: 15px;">
            The following insights are derived from visual analysis of the transaction data:
          </p>
          <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 15px;">
            <h4 style="margin-top: 0; color: #2563eb;">Risk Level Distribution</h4>
            <p>
              ${results.findings ?
          `Analysis reveals ${getRiskDistributionData(results.findings).find(item => item.name === 'High')?.value || 0} high-risk transactions, 
                 ${getRiskDistributionData(results.findings).find(item => item.name === 'Medium')?.value || 0} medium-risk transactions, and
                 ${getRiskDistributionData(results.findings).find(item => item.name === 'Low')?.value || 0} low-risk transactions.` :
          'No risk distribution data available.'}
            </p>
          </div>
          
          ${results.transactionDetails?.suspiciousTransactions ? `
          <div style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 15px;">
            <h4 style="margin-top: 0; color: #7c3aed;">Top Risk Merchants</h4>
            <p>
              ${getMerchantVolumeData(results.transactionDetails.suspiciousTransactions).length > 0 ?
            `The top risk merchant is "${getMerchantVolumeData(results.transactionDetails.suspiciousTransactions)[0]?.merchant}" 
                 with ${getMerchantVolumeData(results.transactionDetails.suspiciousTransactions)[0]?.transactions} suspicious transactions 
                 totaling $${getMerchantVolumeData(results.transactionDetails.suspiciousTransactions)[0]?.amount.toFixed(2)}.` :
            'No merchant volume data available.'}
            </p>
          </div>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #ec4899; padding: 15px; margin-bottom: 15px;">
            <h4 style="margin-top: 0; color: #db2777;">Fraud Type Analysis</h4>
            <p>
              ${getFraudTypeDistribution(results.transactionDetails.suspiciousTransactions).length > 0 ?
            `The most common fraud type detected is "${getFraudTypeDistribution(results.transactionDetails.suspiciousTransactions)[0]?.name}" 
                 with ${getFraudTypeDistribution(results.transactionDetails.suspiciousTransactions)[0]?.value} instances.` :
            'No fraud type distribution data available.'}
            </p>
          </div>
          ` : ''}
          
          ${results.loanEligibility?.accountAnalysis ? `
          <div style="background-color: #f9fafb; border-left: 4px solid #06b6d4; padding: 15px;">
            <h4 style="margin-top: 0; color: #0891b2;">Account Risk Assessment</h4>
            <p>
              Based on account analysis, ${results.loanEligibility.accountAnalysis.filter(a => a.riskLevel === 'low').length} account(s) show low risk,
              ${results.loanEligibility.accountAnalysis.filter(a => a.riskLevel === 'medium').length} account(s) show medium risk, and
              ${results.loanEligibility.accountAnalysis.filter(a => a.riskLevel === 'high').length} account(s) show high risk.
              ${results.loanEligibility.isEligible ?
            `Overall eligibility analysis is positive with a credit score of ${results.loanEligibility.score}.` :
            `Eligibility analysis is negative with a credit score of ${results.loanEligibility.score}.`}
            </p>
          </div>
          ` : ''}
        </div>
      `;

      // Close HTML document
      htmlContent += `
        <div style="margin-top: 40px; color: #666; font-size: 0.8em; text-align: center;">
          Report generated by KYC Digital Onboarding Platform - ${now.toLocaleString()}
        </div>
      </body>
      </html>
      `;

      // Create a blob and download the HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a CSV file to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Send the file to the API endpoint for processing
      const response = await fetch('/api/admin/analyze-transactions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setShowUploadSection(false); // Hide upload section after successful analysis
    } catch (err: any) {
      setError(`Failed to process transaction data: ${err.message || 'Unknown error'}`);
      setResults(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to get transaction trend for an account
  const getAccountTransactionTrend = (accountId: string) => {
    if (!results?.transactionDetails?.suspiciousTransactions) return [];
    return results.transactionDetails.suspiciousTransactions
      .filter(tx => tx.accountId === accountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(tx => ({
        date: tx.date.split('T')[0],
        amount: tx.amount,
        riskScore: tx.riskScore,
        merchant: tx.merchant,
        fraudType: tx.fraudType,
      }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Transaction Analysis</h2>
          <p className="text-gray-600">
            Upload CSV transaction data to detect potential fraudulent activities.
          </p>
        </div>
        {!showUploadSection && results && (
          <button
            onClick={resetAnalysis}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Analysis
          </button>
        )}
      </div>

      {showUploadSection ? (
        <>            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md flex items-start">
          <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium mb-1">Required CSV Format</h4>
            <p className="text-sm mb-2">Your CSV file must follow this format to be properly analyzed:</p>
            <div className="overflow-x-auto bg-white border rounded p-2 text-xs font-mono">
              transaction_id,date,amount,account_id,merchant_name,transaction_type,location,ip_address
            </div>
            <p className="text-sm mt-2">
              <span className="font-semibold">Example:</span> TR-12345,2025-06-23,500.00,ACC-9876,Amazon,purchase,New York,192.168.1.1
            </p>
            <div className="mt-3 flex items-center">
              <FileQuestion className="w-4 h-4 mr-1 text-blue-600" />
              <a href="/assets/sample-transaction-data.csv" download className="text-sm text-blue-600 hover:underline">
                Download sample transaction data
              </a>
            </div>
          </div>
        </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="transaction-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only (MAX. 10MB)</p>
                  </div>
                  <input
                    id="transaction-file"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </label>
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || !file}
                className={`w-full py-2 px-4 rounded-md text-white font-medium 
                  ${isProcessing || !file
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Analyze Transactions'
                )}
              </button>
            </form>
          </div>
        </>
      ) : null}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start mb-6">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}      {results && (
        <div className="space-y-6" ref={reportContainerRef}>          {!showUploadSection && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start mb-6">
            <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>Analysis of <span className="font-medium">{file?.name}</span> completed successfully!</span>
          </div>
        )}

          {/* Data Visualizations/Analytics Section - MOVED TO TOP */}
          {results && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-5 bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text">Transaction Analytics Dashboard</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Risk Distribution Pie Chart */}
                {results.findings && results.findings.length > 0 && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-md font-medium mb-3">Risk Level Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getRiskDistributionData(results.findings)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getRiskDistributionData(results.findings).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} transactions`, 'Count']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Fraud Type Distribution Pie Chart */}
                {results.transactionDetails?.suspiciousTransactions && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-md font-medium mb-3">Fraud Type Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getFraudTypeDistribution(results.transactionDetails.suspiciousTransactions)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getFraudTypeDistribution(results.transactionDetails.suspiciousTransactions).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} transactions`, 'Count']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Merchant Transaction Volume Bar Chart */}
                {results.transactionDetails?.suspiciousTransactions && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-md font-medium mb-3">Top Merchants by Transaction Volume</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getMerchantVolumeData(results.transactionDetails.suspiciousTransactions)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="merchant"
                            angle={-45}
                            textAnchor="end"
                            tick={{ fontSize: 10 }}
                            height={60}
                          />
                          <YAxis />
                          <Tooltip formatter={(value: any, name) => [name === 'amount' ? `$${Number(value).toFixed(2)}` : value, name === 'amount' ? 'Amount' : 'Transactions']} />
                          <Legend />
                          <Bar dataKey="amount" name="Amount ($)" fill="#8884d8" />
                          <Bar dataKey="transactions" name="# of Transactions" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Risk Score Trend Line Chart */}
                {results.transactionDetails?.suspiciousTransactions && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-md font-medium mb-3">Risk Score Trend</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getRiskScoreTrendData(results.transactionDetails.suspiciousTransactions)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="riskScore"
                            name="Risk Score"
                            stroke="#ff7300"
                            activeDot={{ r: 8 }}
                          />
                          <Line yAxisId="right" type="monotone" dataKey="amount" name="Amount ($)" stroke="#387908" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Seasonal Trend Analysis per account */}
                {results.loanEligibility?.accountAnalysis && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm col-span-1 md:col-span-2">
                    <h4 className="text-md font-medium mb-3">Seasonal Trend Analysis (Click account for trend)</h4>
                    <div className="flex flex-wrap gap-4">
                      {results.loanEligibility.accountAnalysis.map(account => (
                        <button
                          key={account.accountId}
                          className={`px-4 py-2 rounded border shadow hover:bg-indigo-50 transition-colors font-mono text-sm ${selectedAccount === account.accountId ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200'}`}
                          onClick={() => { setSelectedAccount(account.accountId); setShowTrendModal(true); }}
                        >
                          {account.accountId}
                        </button>
                      ))}
                    </div>
                    <Modal open={showTrendModal} onClose={() => setShowTrendModal(false)} center>
                      <div className="w-[350px] md:w-[500px] h-[350px]">
                        <h4 className="text-md font-semibold mb-2">Trend for Account: <span className="font-mono">{selectedAccount}</span></h4>
                        <ResponsiveContainer width="100%" height="90%">
                          <LineChart
                            data={selectedAccount ? getAccountTransactionTrend(selectedAccount) : []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value: any, name) => [name === 'amount' ? `$${Number(value).toFixed(2)}` : value, name.charAt(0).toUpperCase() + name.slice(1)]} />
                            <Legend />
                            <Line type="monotone" dataKey="amount" name="Amount ($)" stroke="#3b82f6" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Modal>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Analysis Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Total Transactions</div>
                <div className="text-2xl font-bold">{results.totalTransactions || 0}</div>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Suspicious Transactions</div>
                <div className="text-2xl font-bold text-amber-600">{results.suspiciousTransactions || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((results.suspiciousTransactions / results.totalTransactions) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div className={`bg-white border rounded-lg p-4 shadow-sm ${results.overallRiskScore > 65 ? 'border-red-300' :
                results.overallRiskScore > 35 ? 'border-amber-300' : 'border-green-300'
                }`}>
                <div className="text-gray-500 text-sm mb-1">Fraud Risk Score</div>
                <div className={`text-2xl font-bold ${results.overallRiskScore > 65 ? 'text-red-600' :
                  results.overallRiskScore > 35 ? 'text-amber-600' : 'text-green-600'
                  }`}>{results.overallRiskScore || 0}</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className={`h-2.5 rounded-full ${results.overallRiskScore > 65 ? 'bg-red-500' :
                      results.overallRiskScore > 35 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${results.overallRiskScore}%` }}>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {results.findings && results.findings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Detailed Findings</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.findings.map((finding, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${finding.type === 'Anomaly' ? 'bg-amber-100 text-amber-800' :
                              finding.type === 'Pattern' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'}`}>
                            {finding.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{finding.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${finding.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                              finding.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'}`}>
                            {finding.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{finding.affectedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.transactionDetails?.suspiciousTransactions && results.transactionDetails.suspiciousTransactions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Suspicious Transactions</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.transactionDetails.suspiciousTransactions.map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{tx.id}</td>
                        <td className="px-4 py-3 text-sm">{tx.date}</td>
                        <td className="px-4 py-3 text-sm font-medium">${tx.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">{tx.accountId}</td>
                        <td className="px-4 py-3 text-sm">{tx.merchant}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {tx.fraudType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${tx.riskScore > 75 ? 'bg-red-100 text-red-800' :
                              tx.riskScore > 50 ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'}`}>
                            {tx.riskScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.transactionDetails?.topRiskMerchants && (
            <div>
              <h3 className="text-lg font-semibold mb-3">High Risk Merchants</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suspicious Transactions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.transactionDetails.topRiskMerchants.map((merchant, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{merchant.merchant}</td>
                        <td className="px-4 py-3 text-sm">{merchant.count}</td>
                        <td className="px-4 py-3 text-sm font-medium">${merchant.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}          {results.loanEligibility && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Loan Eligibility Assessment</h3>

              <div className="bg-white border rounded-lg p-5 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="text-2xl font-bold mb-1">
                      {results.loanEligibility.isEligible ? (
                        <span className="text-green-600">Eligible for Loan</span>
                      ) : (
                        <span className="text-red-600">Not Eligible for Loan</span>
                      )}
                    </div>
                    <p className="text-gray-500">
                      Based on transaction history and risk analysis
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${results.loanEligibility.score > 75 ? 'text-green-600' :
                      results.loanEligibility.score > 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                      {results.loanEligibility.score}
                    </div>
                    <div className="text-sm text-gray-500">Credit Score</div>
                  </div>
                </div>

                {results.loanEligibility.isEligible && results.loanEligibility.maxLoanAmount && (
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="text-sm text-gray-600">Recommended Maximum Loan Amount</div>
                    <div className="text-xl font-bold text-blue-700">${results.loanEligibility.maxLoanAmount.toLocaleString()}</div>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="font-medium mb-2 text-gray-700">Eligibility Factors</h4>
                  <div className="space-y-2">
                    {results.loanEligibility.reasonCodes.map((reason, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className={`mt-1 mr-2 rounded-full w-2 h-2 flex-shrink-0 ${reason.impact === 'positive' ? 'bg-green-500' :
                          reason.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                          }`}></div>
                        <div>
                          <div className="text-sm font-medium">{reason.code}</div>
                          <div className="text-xs text-gray-500">{reason.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Account Analysis</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Balance</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Flow</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Velocity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.loanEligibility.accountAnalysis.map((account, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium">{account.accountId}</td>
                            <td className="px-3 py-2 text-sm">${account.averageBalance.toLocaleString()}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${account.cashFlowStability === 'stable' ? 'bg-green-100 text-green-800' :
                                  account.cashFlowStability === 'moderate' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'}`}>
                                {account.cashFlowStability}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${account.transactionVelocity === 'low' ? 'bg-green-100 text-green-800' :
                                  account.transactionVelocity === 'medium' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'}`}>
                                {account.transactionVelocity}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${account.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  account.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'}`}>
                                {account.riskLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>            </div>
          )}

          {/* Download Report Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={generateReport}
              disabled={isGeneratingPdf}
              className={`flex items-center px-4 py-2 ${isGeneratingPdf
                ? 'bg-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white rounded-md transition-colors`}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
