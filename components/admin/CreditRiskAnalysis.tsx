import React, { useState, useCallback } from 'react';
import { 
  BarChart3, Upload, FileText, Sparkles, TrendingUp, TrendingDown, Minus,
  Users, AlertCircle, DollarSign, X, CheckCircle, CreditCard, Calendar,
  Info, AlertTriangle, Shield, ShieldCheck, ShieldAlert, Activity,
  Clock, XCircle, Eye, User, ChevronLeft, ChevronRight
} from 'lucide-react';

// Types
interface LoanData {
  CustomerID: string;
  AccountNumber: string;
  AccountStatus: string;
  AccountStatusDate: string;
  LoanEffectiveDate: string;
  FacilityType: string;
  CreditLimit: number;
  OutstandingAmount: number;
  InstallmentAmount: number;
  Currency: string;
  OverdueAmount: number;
  LastPaymentDate: string;
  RepaymentFrequency: string;
  VestedLimit: number;
  DaysInArrears: number;
}

interface ProcessedCustomerData {
  customerID: string;
  totalCreditLimit: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
  totalInstallmentAmount: number;
  creditUtilization: number;
  loans: LoanWithArrears[];
  activeLoans: number;
  delinquentLoans: number;
  closedLoans: number;
  maxDaysInArrears: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  currencies: string[];
  facilityTypes: string[];
}

interface LoanWithArrears extends LoanData {
  arrearsCategory: 'Current' | 'At-Risk' | 'Delinquent' | 'Closed';
}

// Sample Data
const sampleData: LoanData[] = [
  {
    CustomerID: 'CUST001',
    AccountNumber: 'CUST001-ACCT-001',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Installment',
    CreditLimit: 100000,
    OutstandingAmount: 156549,
    InstallmentAmount: 38744,
    Currency: 'NGN',
    OverdueAmount: 0,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 131173,
    DaysInArrears: 18
  },
  {
    CustomerID: 'CUST001',
    AccountNumber: 'CUST001-ACCT-002',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Overdraft',
    CreditLimit: 100000,
    OutstandingAmount: 42454,
    InstallmentAmount: 0,
    Currency: 'NGN',
    OverdueAmount: 0,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 92686,
    DaysInArrears: 27
  },
  {
    CustomerID: 'CUST002',
    AccountNumber: 'CUST002-ACCT-001',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Installment',
    CreditLimit: 400000,
    OutstandingAmount: 365857,
    InstallmentAmount: 27688,
    Currency: 'USD',
    OverdueAmount: 42422,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 320230,
    DaysInArrears: 45
  },
  {
    CustomerID: 'CUST002',
    AccountNumber: 'CUST002-ACCT-002',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Revolving',
    CreditLimit: 200000,
    OutstandingAmount: 167411,
    InstallmentAmount: 0,
    Currency: 'USD',
    OverdueAmount: 0,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Weekly',
    VestedLimit: 186281,
    DaysInArrears: 15
  },
  {
    CustomerID: 'CUST003',
    AccountNumber: 'CUST003-ACCT-001',
    AccountStatus: 'Delinquent',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Installment',
    CreditLimit: 500000,
    OutstandingAmount: 259851,
    InstallmentAmount: 56608,
    Currency: 'EUR',
    OverdueAmount: 31134,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 447925,
    DaysInArrears: 90
  },
  {
    CustomerID: 'CUST003',
    AccountNumber: 'CUST003-ACCT-002',
    AccountStatus: 'Delinquent',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Secured',
    CreditLimit: 300000,
    OutstandingAmount: 248060,
    InstallmentAmount: 0,
    Currency: 'EUR',
    OverdueAmount: 55716,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Quarterly',
    VestedLimit: 269906,
    DaysInArrears: 75
  },
  {
    CustomerID: 'CUST004',
    AccountNumber: 'CUST004-ACCT-001',
    AccountStatus: 'Closed',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Installment',
    CreditLimit: 250000,
    OutstandingAmount: 0,
    InstallmentAmount: 14041,
    Currency: 'NGN',
    OverdueAmount: 0,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 240885,
    DaysInArrears: 5
  },
  {
    CustomerID: 'CUST005',
    AccountNumber: 'CUST005-ACCT-001',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Overdraft',
    CreditLimit: 150000,
    OutstandingAmount: 109312,
    InstallmentAmount: 0,
    Currency: 'USD',
    OverdueAmount: 0,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Weekly',
    VestedLimit: 136203,
    DaysInArrears: 5
  },
  {
    CustomerID: 'CUST005',
    AccountNumber: 'CUST005-ACCT-002',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Installment',
    CreditLimit: 350000,
    OutstandingAmount: 332907,
    InstallmentAmount: 46533,
    Currency: 'USD',
    OverdueAmount: 47315,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 343442,
    DaysInArrears: 65
  },
  {
    CustomerID: 'CUST005',
    AccountNumber: 'CUST005-ACCT-003',
    AccountStatus: 'Active',
    AccountStatusDate: '21:04.5',
    LoanEffectiveDate: '21:04.5',
    FacilityType: 'Revolving',
    CreditLimit: 200000,
    OutstandingAmount: 105829,
    InstallmentAmount: 0,
    Currency: 'USD',
    OverdueAmount: 0,
    LastPaymentDate: '21:04.5',
    RepaymentFrequency: 'Monthly',
    VestedLimit: 182490,
    DaysInArrears: 30
  }
];

// Utility Functions
function categorizeArrears(daysInArrears: number, accountStatus: string): 'Current' | 'At-Risk' | 'Delinquent' | 'Closed' {
  if (accountStatus === 'Closed') return 'Closed';
  if (accountStatus === 'Delinquent') return 'Delinquent';
  if (daysInArrears === 0) return 'Current';
  if (daysInArrears <= 30) return 'At-Risk';
  return 'Delinquent';
}

function calculateRiskScore(
  creditUtilization: number,
  maxDaysInArrears: number,
  overdueRatio: number,
  accountStatuses: string[]
): number {
  const utilizationScore = Math.min(creditUtilization * 100, 100) * 0.3;
  const arrearsScore = maxDaysInArrears > 90 
    ? 100 * 0.3 
    : (maxDaysInArrears / 90) * 100 * 0.3;
  const overdueScore = Math.min(overdueRatio * 100, 100) * 0.25;
  const delinquentCount = accountStatuses.filter(status => status === 'Delinquent').length;
  const statusScore = accountStatuses.length > 0 
    ? (delinquentCount / accountStatuses.length) * 100 * 0.15 
    : 0;
  
  return Math.min(Math.round(utilizationScore + arrearsScore + overdueScore + statusScore), 100);
}

function getRiskLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score <= 40) return 'Low';
  if (score <= 70) return 'Medium';
  return 'High';
}

function processCustomerData(loans: LoanData[]): ProcessedCustomerData[] {
  const customerGroups = loans.reduce((groups, loan) => {
    if (!groups[loan.CustomerID]) {
      groups[loan.CustomerID] = [];
    }
    groups[loan.CustomerID].push(loan);
    return groups;
  }, {} as Record<string, LoanData[]>);

  return Object.entries(customerGroups).map(([customerID, customerLoans]) => {
    const totalCreditLimit = customerLoans.reduce((sum, loan) => sum + loan.CreditLimit, 0);
    const totalOutstanding = customerLoans.reduce((sum, loan) => sum + loan.OutstandingAmount, 0);
    const totalOverdueAmount = customerLoans.reduce((sum, loan) => sum + loan.OverdueAmount, 0);
    const totalInstallmentAmount = customerLoans.reduce((sum, loan) => sum + loan.InstallmentAmount, 0);
    const creditUtilization = totalCreditLimit > 0 ? totalOutstanding / totalCreditLimit : 0;
    const overdueRatio = totalOutstanding > 0 ? totalOverdueAmount / totalOutstanding : 0;

    const loansWithArrears: LoanWithArrears[] = customerLoans.map(loan => ({
      ...loan,
      arrearsCategory: categorizeArrears(loan.DaysInArrears, loan.AccountStatus)
    }));

    const activeLoans = loansWithArrears.filter(loan => loan.AccountStatus === 'Active').length;
    const delinquentLoans = loansWithArrears.filter(loan => loan.AccountStatus === 'Delinquent').length;
    const closedLoans = loansWithArrears.filter(loan => loan.AccountStatus === 'Closed').length;
    
    const maxDaysInArrears = Math.max(...loansWithArrears.map(loan => loan.DaysInArrears));
    const accountStatuses = customerLoans.map(loan => loan.AccountStatus);
    
    const riskScore = calculateRiskScore(creditUtilization, maxDaysInArrears, overdueRatio, accountStatuses);
    const riskLevel = getRiskLevel(riskScore);

    const currencies = [...new Set(customerLoans.map(loan => loan.Currency))];
    const facilityTypes = [...new Set(customerLoans.map(loan => loan.FacilityType))];

    return {
      customerID,
      totalCreditLimit,
      totalOutstanding,
      totalOverdueAmount,
      totalInstallmentAmount,
      creditUtilization,
      loans: loansWithArrears,
      activeLoans,
      delinquentLoans,
      closedLoans,
      maxDaysInArrears,
      riskScore,
      riskLevel,
      currencies,
      facilityTypes
    };
  });
}

function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const currencyMap: Record<string, string> = {
    'NGN': 'en-NG',
    'USD': 'en-US',
    'EUR': 'en-EU'
  };
  
  const locale = currencyMap[currency] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCSV(csvText: string): LoanData[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const loan: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (['CreditLimit', 'OutstandingAmount', 'InstallmentAmount', 'OverdueAmount', 'VestedLimit', 'DaysInArrears'].includes(header)) {
        loan[header] = parseFloat(value) || 0;
      } else {
        loan[header] = value;
      }
    });
    
    return loan as LoanData;
  });
}

function CreditRiskAnalysis() {
  const [processedData, setProcessedData] = useState<ProcessedCustomerData[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUsingDemo, setIsUsingDemo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);
  const [showLoanDetails, setShowLoanDetails] = useState(false);

  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          throw new Error('No valid data found in CSV file');
        }
        
        const processed = processCustomerData(parsedData);
        setProcessedData(processed);
        setUploadedFileName(file.name);
        setIsUsingDemo(false);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error processing CSV:', error);
        setError(error instanceof Error ? error.message : 'Error processing CSV file. Please check the format and try again.');
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleUseDemoData = () => {
    setIsProcessing(true);
    setError('');
    
    setTimeout(() => {
      const processed = processCustomerData(sampleData);
      setProcessedData(processed);
      setUploadedFileName('');
      setIsUsingDemo(true);
      setIsProcessing(false);
    }, 1000);
  };

  const handleClearFile = () => {
    setProcessedData([]);
    setUploadedFileName('');
    setIsUsingDemo(false);
    setError('');
    setCurrentCustomerIndex(0);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        handleFileUpload(files[0]);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const hasData = processedData.length > 0;
  const currentCustomer = processedData[currentCustomerIndex];

  const nextCustomer = () => {
    setCurrentCustomerIndex((prev) => (prev + 1) % processedData.length);
  };

  const prevCustomer = () => {
    setCurrentCustomerIndex((prev) => (prev - 1 + processedData.length) % processedData.length);
  };

  // Portfolio overview calculations
  const portfolioStats = hasData ? {
    totalCustomers: processedData.length,
    totalOutstanding: processedData.reduce((sum, c) => sum + c.totalOutstanding, 0),
    totalOverdue: processedData.reduce((sum, c) => sum + c.totalOverdueAmount, 0),
    highRiskCustomers: processedData.filter(c => c.riskLevel === 'High').length,
    avgRiskScore: processedData.length > 0 ? Math.round(processedData.reduce((sum, c) => sum + c.riskScore, 0) / processedData.length) : 0,
    delinquentAccounts: processedData.reduce((sum, c) => sum + c.delinquentLoans, 0),
    totalAccounts: processedData.reduce((sum, c) => sum + c.loans.length, 0)
  } : null;

  // File Upload Component
  const FileUploadComponent = () => (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-red-800">Upload Error</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </div>
      )}
      
      {uploadedFileName ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">{uploadedFileName}</div>
                <div className="text-sm text-green-600">CSV file uploaded successfully</div>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="p-1 hover:bg-green-100 rounded transition-colors duration-200 group"
            >
              <X className="w-4 h-4 text-green-600 group-hover:text-green-800" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${
            isProcessing 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <div className={`w-12 h-12 mx-auto mb-4 ${isProcessing ? 'animate-bounce' : ''}`}>
            <Upload className={`w-full h-full ${isProcessing ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <div className="mb-4">
            <div className="text-lg font-medium text-gray-900 mb-2">
              {isProcessing ? 'Processing CSV File...' : 'Upload CSV File'}
            </div>
            <div className="text-sm text-gray-600">
              {isProcessing 
                ? 'Please wait while we process your file...' 
                : 'Drag and drop your loan data CSV file here, or click to browse'
              }
            </div>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              isProcessing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Select CSV File'}
          </label>
          
        </div>
      )}
    </div>
  );

  // Credit Utilization Gauge Component
  const CreditUtilizationGauge = ({ utilization, outstanding, creditLimit }: {
    utilization: number;
    outstanding: number;
    creditLimit: number;
  }) => {
    const percentage = Math.round(utilization * 100);
    const circumference = 2 * Math.PI * 90;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const getColor = (percent: number) => {
      if (percent <= 50) return '#10B981';
      if (percent <= 80) return '#F59E0B';
      return '#EF4444';
    };

    const getRiskLabel = (percent: number) => {
      if (percent <= 50) return 'Low Risk';
      if (percent <= 80) return 'Moderate Risk';
      return 'High Risk';
    };

    const color = getColor(percentage);
    const riskLabel = getRiskLabel(percentage);
    const availableCredit = creditLimit - outstanding;
    
    const getTrendIcon = (percent: number) => {
      if (percent <= 30) return <TrendingDown className="w-4 h-4 text-green-600" />;
      if (percent <= 70) return <Minus className="w-4 h-4 text-yellow-600" />;
      return <TrendingUp className="w-4 h-4 text-red-600" />;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Credit Utilization</h3>
            {getTrendIcon(percentage)}
          </div>
          <div className="group relative">
            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center cursor-help">
              <span className="text-xs text-gray-600">?</span>
            </div>
            <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <div className="space-y-1">
                <div className="font-semibold">Credit Utilization Formula :</div>
                <div>Outstanding Amount ÷ Credit Limit</div>
                <div className="text-xs text-gray-300 mt-2">
                  Lower utilization indicates better credit management
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={color}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-2000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 ">{percentage}%</div>
                <div className="text-sm text-gray-600 mt-1">{riskLabel}</div>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-2xl font-semibold text-gray-900">
              ₦{outstanding.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              of ₦{creditLimit.toLocaleString()} used
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Available Credit : </span>
                <span className="font-semibold text-green-600">₦{availableCredit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Outstanding Debt Card Component
  const OutstandingDebtCard = ({ 
    totalOutstanding, 
    totalOverdue,
    totalLoans = 0,
    currencies = ['NGN']
  }: {
    totalOutstanding: number;
    totalOverdue: number;
    totalLoans?: number;
    currencies?: string[];
  }) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatLargeNumber = (num: number, currency: string = 'NGN') => {
      if (num >= 1000000) {
        return `${formatCurrency(num / 1000000, currency).replace(/[^\d.,₦$€]/g, '')}M`;
      } else if (num >= 1000) {
        return `${formatCurrency(num / 1000, currency).replace(/[^\d.,₦$€]/g, '')}K`;
      }
      return formatCurrency(num, currency);
    };

    const overduePercentage = totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;
    const primaryCurrency = currencies[0] || 'NGN';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200 transform">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Outstanding Balance
              </h3>
            </div>
          </div>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            <div className="absolute right-0 top-6 w-56 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              Total amount owed across all active loan facilities
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-4xl font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-200">
            {formatCurrency(totalOutstanding, primaryCurrency)}
          </div>
          <div className="text-lg text-gray-500 mb-1">
            {formatLargeNumber(totalOutstanding, primaryCurrency)} total debt
          </div>
          <div className="text-sm text-gray-500">
            <Calendar className="w-4 h-4 inline mr-1" />
            Updated {currentDate}
          </div>
        </div>

        {totalOverdue > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-800">Overdue Amount</div>
                <div className="text-lg font-bold text-red-900">
                  {formatCurrency(totalOverdue, primaryCurrency)}
                </div>
                <div className="text-xs text-red-600">
                  {overduePercentage.toFixed(1)}% of total outstanding
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 font-medium uppercase tracking-wider">Active Accounts</div>
            <div className="text-lg font-bold text-blue-800">{totalLoans}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Avg per Account</div>
            <div className="text-lg font-bold text-gray-800">
              {totalLoans > 0 ? formatCurrency(Math.round(totalOutstanding / totalLoans), primaryCurrency) : formatCurrency(0, primaryCurrency)}
            </div>
          </div>
        </div>

        {currencies.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Currencies:</div>
            <div className="flex flex-wrap gap-1">
              {currencies.map(currency => (
                <span key={currency} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {currency}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Days in Arrears Chips Component
  const DaysInArrearsChips = ({ 
    onTimeLoans, 
    atRiskLoans, 
    criticalLoans 
  }: {
    onTimeLoans: number;
    atRiskLoans: number;
    criticalLoans: number;
  }) => {
    const totalLoans = onTimeLoans + atRiskLoans + criticalLoans;
    const healthScore = totalLoans > 0 ? Math.round((onTimeLoans / totalLoans) * 100) : 0;
    
    const getHealthColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform ">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
            <div className={`text-sm font-medium ${getHealthColor(healthScore)}`}>
              {healthScore}% healthy
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Accounts</div>
            <div className="text-lg font-bold text-gray-900">{totalLoans}</div>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors duration-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium text-green-800">Current Accounts</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-800">{onTimeLoans}</span>
              <div className="text-xs text-green-600">
                {totalLoans > 0 ? Math.round((onTimeLoans / totalLoans) * 100) : 0}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors duration-200 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-yellow-100 rounded-full group-hover:bg-yellow-200 transition-colors duration-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="font-medium text-yellow-800">At-Risk (1-30 days)</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-yellow-800">{atRiskLoans}</span>
              <div className="text-xs text-yellow-600">
                {totalLoans > 0 ? Math.round((atRiskLoans / totalLoans) * 100) : 0}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors duration-200 cursor-pointer group">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors duration-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium text-red-800">Delinquent ({'>'}30 days)</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-800">{criticalLoans}</span>
              <div className="text-xs text-red-600">
                {totalLoans > 0 ? Math.round((criticalLoans / totalLoans) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Portfolio Health</span>
            <span className={`text-sm font-bold ${getHealthColor(healthScore)}`}>{healthScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                healthScore >= 80 ? 'bg-green-500' : 
                healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
        </div>
        
        <button
          onClick={() => setShowLoanDetails(true)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          <span>View All Accounts</span>
        </button>
      </div>
    );
  };

  // Risk Score Badge Component
  const RiskScoreBadge = ({ riskScore, riskLevel }: {
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  }) => {
    const getRiskConfig = (level: 'Low' | 'Medium' | 'High') => {
      switch (level) {
        case 'Low':
          return {
            color: 'text-green-800',
            bgColor: 'bg-green-100',
            hoverBgColor: 'hover:bg-green-200',
            borderColor: 'border-green-200',
            icon: ShieldCheck,
            iconColor: 'text-green-600',
            trendIcon: TrendingDown,
            recommendation: 'Excellent credit management'
          };
        case 'Medium':
          return {
            color: 'text-yellow-800',
            bgColor: 'bg-yellow-100',
            hoverBgColor: 'hover:bg-yellow-200',
            borderColor: 'border-yellow-200',
            icon: Shield,
            iconColor: 'text-yellow-600',
            trendIcon: Activity,
            recommendation: 'Monitor payment patterns'
          };
        case 'High':
          return {
            color: 'text-red-800',
            bgColor: 'bg-red-100',
            hoverBgColor: 'hover:bg-red-200',
            borderColor: 'border-red-200',
            icon: ShieldAlert,
            iconColor: 'text-red-600',
            trendIcon: TrendingUp,
            recommendation: 'Immediate attention required'
          };
      }
    };

    const config = getRiskConfig(riskLevel);
    const IconComponent = config.icon;
    const TrendIconComponent = config.trendIcon;
    
    const getScoreColor = (score: number) => {
      if (score <= 40) return 'text-green-600';
      if (score <= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
            <TrendIconComponent className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div className="group relative">
            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center cursor-help">
              <span className="text-xs text-gray-600">?</span>
            </div>
            <div className="absolute right-0 top-6 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <div className="space-y-2">
                <div className="font-semibold">Risk Score Components:</div>
                <div>• Credit utilization (40%)</div>
                <div>• Payment arrears (40%)</div>
                <div>• Repayment patterns (20%)</div>
                <div className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-700">
                  Lower scores indicate better creditworthiness
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={riskLevel === 'Low' ? '#10B981' : riskLevel === 'Medium' ? '#F59E0B' : '#EF4444'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${riskScore * 2.51} 251`}
                className="transition-all duration-2000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(riskScore)}`}>{riskScore}</div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-200 ${config.bgColor} ${config.hoverBgColor} ${config.borderColor}`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
              <span className={`font-semibold ${config.color}`}>
                {riskLevel} Risk
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">
              Recommendation
            </div>
            <div className="text-sm text-gray-800 font-medium">
              {config.recommendation}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Customer Summary Card Component
  const CustomerSummaryCard = ({ customer }: { customer: ProcessedCustomerData }) => {
    const utilizationPercentage = Math.round(customer.creditUtilization * 100);
    
    const getUtilizationTrend = (percentage: number) => {
      if (percentage <= 30) return { icon: TrendingDown, color: 'text-green-600', label: 'Excellent' };
      if (percentage <= 70) return { icon: Minus, color: 'text-yellow-600', label: 'Moderate' };
      return { icon: TrendingUp, color: 'text-red-600', label: 'High' };
    };

    const trend = getUtilizationTrend(utilizationPercentage);
    const TrendIcon = trend.icon;

    return (
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Customer {customer.customerID}</h3>
              <p className="text-gray-600">Credit Portfolio Summary</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
            customer.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
            customer.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            <span>{customer.riskLevel} Risk</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Active Loans</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{customer.loans.length}</div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <TrendIcon className={`w-4 h-4 ${trend.color}`} />
              <span className="text-sm font-medium text-gray-600">Utilization</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <div className="text-2xl font-bold text-gray-900">{utilizationPercentage}%</div>
              <div className={`text-xs font-medium ${trend.color}`}>{trend.label}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Max Arrears</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {customer.maxDaysInArrears} 
              <span className="text-sm font-normal text-gray-600 ml-1">days</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Risk Score</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {customer.riskScore}
              <span className="text-sm font-normal text-gray-600 ml-1">/100</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{customer.loans.filter(loan => loan.AccountStatus === 'Active' && loan.DaysInArrears === 0).length} on-time</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{customer.loans.filter(loan => loan.AccountStatus === 'Active' && loan.DaysInArrears > 0 && loan.DaysInArrears <= 30).length} at-risk</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{customer.delinquentLoans} critical</span>
              </div>
            </div>
            <div className="text-gray-600">
              ₦{customer.totalOutstanding.toLocaleString()} outstanding
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loan Details Modal Component
  const LoanDetailsModal = () => {
    if (!showLoanDetails || !currentCustomer) return null;

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Active':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'Delinquent':
          return <AlertCircle className="w-4 h-4 text-red-600" />;
        case 'Closed':
          return <XCircle className="w-4 h-4 text-gray-600" />;
        default:
          return <Clock className="w-4 h-4 text-yellow-600" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Active':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'Delinquent':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'Closed':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      }
    };

    const getArrearsColor = (days: number) => {
      if (days === 0) return 'text-green-600';
      if (days <= 30) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="fixed h-screen inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Loan Portfolio Details</h2>
                <p className="text-gray-600">Customer {currentCustomer.customerID} - {currentCustomer.loans.length} accounts</p>
              </div>
            </div>
            <button
              onClick={() => setShowLoanDetails(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm font-medium text-blue-600 mb-1">Total Credit Limit</div>
                <div className="text-xl font-bold text-blue-900">
                  {formatCurrency(currentCustomer.totalCreditLimit, currentCustomer.currencies[0])}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm font-medium text-purple-600 mb-1">Outstanding Amount</div>
                <div className="text-xl font-bold text-purple-900">
                  {formatCurrency(currentCustomer.totalOutstanding, currentCustomer.currencies[0])}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-sm font-medium text-red-600 mb-1">Overdue Amount</div>
                <div className="text-xl font-bold text-red-900">
                  {formatCurrency(currentCustomer.totalOverdueAmount, currentCustomer.currencies[0])}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm font-medium text-green-600 mb-1">Monthly Installments</div>
                <div className="text-xl font-bold text-green-900">
                  {formatCurrency(currentCustomer.totalInstallmentAmount, currentCustomer.currencies[0])}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days in Arrears</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vested Limit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCustomer.loans.map((loan) => (
                      <tr key={loan.AccountNumber} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{loan.AccountNumber}</div>
                            <div className="text-xs text-gray-500">Effective: {loan.LoanEffectiveDate}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.AccountStatus)}`}>
                            {getStatusIcon(loan.AccountStatus)}
                            <span>{loan.AccountStatus}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{loan.FacilityType}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(loan.CreditLimit, loan.Currency)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(loan.OutstandingAmount, loan.Currency)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${loan.OverdueAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatCurrency(loan.OverdueAmount, loan.Currency)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">
                            {loan.InstallmentAmount > 0 ? formatCurrency(loan.InstallmentAmount, loan.Currency) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {loan.Currency}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${getArrearsColor(loan.DaysInArrears)}`}>
                            {loan.DaysInArrears} days
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{loan.RepaymentFrequency}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(loan.VestedLimit, loan.Currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Currencies</h4>
                <div className="flex flex-wrap gap-2">
                  {currentCustomer.currencies.map(currency => (
                    <span key={currency} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currency}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Facility Types</h4>
                <div className="flex flex-wrap gap-2">
                  {currentCustomer.facilityTypes.map(type => (
                    <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowLoanDetails(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white shadow rounded-lg">
      <div className="p-6 border-b">
        {/* Header */}
        <div className=" mb-12">
         
            
            <h2 className="text-xl font-semibold mb-4">Credit Risk Analysis</h2>
        
         
          <p className="text-sm text-gray-600 mb-4">
            Upload your loan portfolio CSV file to analyze credit utilization, account status, 
            and risk assessment for your customers with real-time insights and interactive visualizations.
          </p>
        </div>

        {!hasData ? (
          /* Upload Section */
          <div className="space-y-8">
            <FileUploadComponent />
            
            <div className="text-center space-y-4">
              <div className="text-gray-500 mb-4">or</div>
              <button
                onClick={handleUseDemoData}
                disabled={isProcessing}
                className={`inline-flex items-center space-x-2 px-8 py-4 rounded-xl font-medium transition-all duration-200 ${
                  isProcessing 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 hover:shadow-lg transform hover:-translate-y-1'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>{isProcessing ? 'Loading Demo...' : 'Try Demo Data'}</span>
              </button>
              <div className="text-sm text-gray-500">
                Experience the analysis with sample loan portfolio data
              </div>
            </div>
            
            {/* Sample CSV Structure */}
            <div className="max-w-6xl mx-auto mt-12">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Expected CSV Format</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Customer Information</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="font-medium">CustomerID:</span> <span className="text-gray-700">CUST001</span></li>
                    <li className="flex justify-between"><span className="font-medium">AccountNumber:</span> <span className="text-gray-700">CUST001-ACCT-001</span></li>
                    <li className="flex justify-between"><span className="font-medium">AccountStatus:</span> <span className="text-gray-700">Active</span></li>
                    <li className="flex justify-between"><span className="font-medium">AccountStatusDate:</span> <span className="text-gray-700">21:04.5</span></li>
                    <li className="flex justify-between"><span className="font-medium">LoanEffectiveDate:</span> <span className="text-gray-700">21:04.5</span></li>
                  </ul>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h4 className="font-medium text-indigo-800 mb-2">Loan Details</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="font-medium">FacilityType:</span> <span className="text-gray-700">Installment</span></li>
                    <li className="flex justify-between"><span className="font-medium">CreditLimit:</span> <span className="text-gray-700">100000</span></li>
                    <li className="flex justify-between"><span className="font-medium">OutstandingAmount:</span> <span className="text-gray-700">156549</span></li>
                    <li className="flex justify-between"><span className="font-medium">InstallmentAmount:</span> <span className="text-gray-700">38744</span></li>
                    <li className="flex justify-between"><span className="font-medium">Currency:</span> <span className="text-gray-700">NGN</span></li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2">Payment Information</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="font-medium">OverdueAmount:</span> <span className="text-gray-700">0</span></li>
                    <li className="flex justify-between"><span className="font-medium">LastPaymentDate:</span> <span className="text-gray-700">21:04.5</span></li>
                    <li className="flex justify-between"><span className="font-medium">RepaymentFrequency:</span> <span className="text-gray-700">Monthly</span></li>
                    <li className="flex justify-between"><span className="font-medium">VestedLimit:</span> <span className="text-gray-700">131173</span></li>
                    <li className="flex justify-between"><span className="font-medium">DaysInArrears:</span> <span className="text-gray-700">18</span></li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h4 className="font-medium text-gray-800 mb-2">CSV Header Format</h4>
                <div className="text-xs bg-white p-3 rounded border border-gray-300 font-mono overflow-x-auto">
                  CustomerID,AccountNumber,AccountStatus,AccountStatusDate,LoanEffectiveDate,FacilityType,CreditLimit,OutstandingAmount,InstallmentAmount,Currency,OverdueAmount,LastPaymentDate,RepaymentFrequency,VestedLimit,DaysInArrears
                </div>
              </div>
              <div className="mt-6 bg-green-50 p-4 rounded-lg ">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900 mb-1">Pro Tip</div>
                    <div className="text-sm text-green-800">
                      Ensure your CSV file includes all required columns with proper formatting. 
                      The system will automatically calculate risk scores and payment status analysis based on account status, 
                      days in arrears, and overdue amounts.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard Section */
          <div className="space-y-8">
            {/* Portfolio Overview */}
            {processedData.length > 1 && portfolioStats && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Portfolio Overview</span>
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 font-medium">Total Customers</div>
                    <div className="text-2xl font-bold text-gray-900">{portfolioStats.totalCustomers}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 font-medium">Total Accounts</div>
                    <div className="text-2xl font-bold text-gray-900">{portfolioStats.totalAccounts}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 font-medium">Outstanding</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(portfolioStats.totalOutstanding)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 font-medium">Overdue</div>
                    <div className="text-lg font-bold text-red-600">{formatCurrency(portfolioStats.totalOverdue)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 font-medium">High Risk</div>
                    <div className="text-2xl font-bold text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-5 h-5" />
                      <span>{portfolioStats.highRiskCustomers}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 font-medium">Avg Risk Score</div>
                    <div className="text-2xl font-bold text-gray-900 flex items-center space-x-1">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span>{portfolioStats.avgRiskScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Customer Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isUsingDemo ? (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                    <Sparkles className="w-4 h-4" />
                    <span>Demo Data</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                    <FileText className="w-4 h-4" />
                    <span>{uploadedFileName}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleClearFile}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
              >
                Change Data Source
              </button>
            </div>

            {currentCustomer && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                      <span>Customer Credit Summary</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentCustomer.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                        currentCustomer.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentCustomer.riskLevel} Risk
                      </div>
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Customer {currentCustomer.customerID} - {currentCustomer.loans.length} active account{currentCustomer.loans.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {processedData.length > 1 && (
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          Customer {currentCustomerIndex + 1} of {processedData.length}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {currentCustomer.customerID}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={prevCustomer}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 disabled:opacity-50"
                          disabled={processedData.length <= 1}
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={nextCustomer}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 disabled:opacity-50"
                          disabled={processedData.length <= 1}
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <CustomerSummaryCard customer={currentCustomer} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CreditUtilizationGauge
                    utilization={currentCustomer.creditUtilization}
                    outstanding={currentCustomer.totalOutstanding}
                    creditLimit={currentCustomer.totalCreditLimit}
                  />
                  
                  <OutstandingDebtCard
                    totalOutstanding={currentCustomer.totalOutstanding}
                    totalOverdue={currentCustomer.totalOverdueAmount}
                    totalLoans={currentCustomer.loans.length}
                    currencies={currentCustomer.currencies}
                  />
                  
                  <DaysInArrearsChips
                    onTimeLoans={currentCustomer.loans.filter(loan => loan.AccountStatus === 'Active' && loan.DaysInArrears === 0).length}
                    atRiskLoans={currentCustomer.loans.filter(loan => loan.AccountStatus === 'Active' && loan.DaysInArrears > 0 && loan.DaysInArrears <= 30).length}
                    criticalLoans={currentCustomer.delinquentLoans}
                  />
                  
                  <RiskScoreBadge
                    riskScore={currentCustomer.riskScore}
                    riskLevel={currentCustomer.riskLevel}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <LoanDetailsModal />
      </div>
    </div>
  );
}

export default CreditRiskAnalysis;