import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * API endpoint to analyze transaction data for fraud detection
 * 
 * @param req - The incoming request with CSV file
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get the form data with the file
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file type (must be CSV)
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Read the file content
    const fileText = await file.text();
    
    // Process the CSV data
    // This is a placeholder - in a real implementation, we would call actual fraud detection processor
    const analysisResults = processTransactionData(fileText);

    return NextResponse.json(analysisResults, { status: 200 });
  } catch (error: any) {
    console.error('Error processing transaction data:', error);
    
    return NextResponse.json(
      { error: 'Failed to process transaction data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process CSV transaction data for fraud patterns
 * Detects various types of fraud patterns in transaction data
 * 
 * Expected CSV format:
 * transaction_id,date,amount,account_id,merchant_name,transaction_type,location,ip_address
 * 
 * Field descriptions:
 * - transaction_id: Unique identifier for the transaction (e.g., TX-12345)
 * - date: Date of transaction in YYYY-MM-DD format (e.g., 2025-06-23)
 * - amount: Transaction amount as a number, can have decimals (e.g., 500.00)
 * - account_id: Account identifier (e.g., ACC-9876)
 * - merchant_name: Name of the merchant or recipient (e.g., Amazon)
 * - transaction_type: Category of transaction (e.g., purchase, transfer, subscription)
 * - location: Geographic location of the transaction (e.g., New York)
 * - ip_address: IP address associated with the transaction (e.g., 192.168.1.1)
 * 
 * @param csvData - The CSV data as string
 * @returns Analysis results
 */
function processTransactionData(csvData: string) {
  // Parse CSV - basic parsing
  const rows = csvData.trim().split('\n');
  const headers = rows[0].split(',');
  
  // Validate expected headers
  const requiredHeaders = [
    'transaction_id', 'date', 'amount', 'account_id', 
    'merchant_name', 'transaction_type', 'location', 'ip_address'
  ];
  
  // Check for required columns
  const missingColumns = requiredHeaders.filter(header => 
    !headers.map(h => h.trim().toLowerCase()).includes(header.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    throw new Error(`CSV missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Parse all transactions
  const transactions = rows.slice(1).map(row => {
    const values = row.split(',');
    const transaction: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      const key = header.trim().toLowerCase();      let value: string | number = values[index]?.trim() || '';
      
      // Convert amount to number
      if (key === 'amount' && value) {
        value = parseFloat(value);
      }
      
      transaction[key] = value;
    });
    
    return transaction;
  });

  // Skip empty rows
  const validTransactions = transactions.filter(t => 
    t.transaction_id && t.amount && !isNaN(t.amount)
  );
  
  // Fraud detection logic
  const suspiciousTransactions: any[] = [];
  const accountFrequency: Record<string, number> = {};
  const merchantFrequency: Record<string, {count: number, amount: number}> = {};
  const ipFrequency: Record<string, number> = {};
  const locationFrequency: Record<string, {accountIds: Set<string>}> = {};
  
  // Find transaction anomalies
  validTransactions.forEach(transaction => {
    const { account_id, merchant_name, ip_address, location, amount } = transaction;
    
    // Track account frequency
    accountFrequency[account_id] = (accountFrequency[account_id] || 0) + 1;
    
    // Track merchant frequency
    if (!merchantFrequency[merchant_name]) {
      merchantFrequency[merchant_name] = { count: 0, amount: 0 };
    }
    merchantFrequency[merchant_name].count++;
    merchantFrequency[merchant_name].amount += amount;
    
    // Track IP frequency
    if (ip_address) {
      ipFrequency[ip_address] = (ipFrequency[ip_address] || 0) + 1;
    }
    
    // Track unique accounts per location
    if (location && account_id) {
      if (!locationFrequency[location]) {
        locationFrequency[location] = { accountIds: new Set() };
      }
      locationFrequency[location].accountIds.add(account_id);
    }
    
    // Check for high value transactions
    if (amount > 5000) {
      suspiciousTransactions.push({
        ...transaction,
        fraudType: 'High Value Transaction',
        riskScore: 65
      });
    }
    
    // Round number transactions (potential structuring)
    if (amount % 100 === 0 && amount >= 1000) {
      suspiciousTransactions.push({
        ...transaction,
        fraudType: 'Potential Structuring',
        riskScore: 55
      });
    }
  });
  
  // Check for rapid frequency
  Object.entries(accountFrequency).forEach(([accountId, count]) => {
    if (count > 5) {
      // Find all transactions for this account
      const accountTxs = validTransactions.filter(t => t.account_id === accountId);
      
      // Add high-frequency account transactions to suspicious list
      accountTxs.forEach(tx => {
        if (!suspiciousTransactions.some(st => st.transaction_id === tx.transaction_id)) {
          suspiciousTransactions.push({
            ...tx,
            fraudType: 'Unusual Frequency',
            riskScore: 70
          });
        }
      });
    }
  });
  
  // Check for multiple locations in short time
  Object.entries(locationFrequency).forEach(([location, data]) => {
    // If a single location has too many different accounts, that's suspicious
    if (data.accountIds.size > 3) {
      const locationTxs = validTransactions.filter(t => t.location === location);
      locationTxs.forEach(tx => {
        if (!suspiciousTransactions.some(st => st.transaction_id === tx.transaction_id)) {
          suspiciousTransactions.push({
            ...tx,
            fraudType: 'Location Anomaly',
            riskScore: 60
          });
        }
      });
    }
  });
  
  // Find merchants with high risk scores
  const topRiskMerchants = Object.entries(merchantFrequency)
    .map(([merchant, data]) => ({
      merchant,
      count: data.count,
      totalAmount: data.amount
    }))
    .filter(item => item.count > 2)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);
  
  // Prepare detailed findings
  const findings = [
    {
      type: 'Anomaly',
      description: 'Unusual transaction frequency detected for same account',
      riskLevel: 'Medium',
      affectedCount: Object.values(accountFrequency).filter(count => count > 5).length
    },
    {
      type: 'Pattern',
      description: 'Multiple high-value transactions',
      riskLevel: 'High',
      affectedCount: validTransactions.filter(t => t.amount > 5000).length
    },
    {
      type: 'Anomaly',
      description: 'Potential structuring (round numbers)',
      riskLevel: 'Medium',
      affectedCount: validTransactions.filter(t => t.amount % 100 === 0 && t.amount >= 1000).length
    },
    {
      type: 'Pattern',
      description: 'Location anomalies',
      riskLevel: 'Low',
      affectedCount: Object.values(locationFrequency)
        .filter(loc => loc.accountIds.size > 3).length
    }
  ].filter(finding => finding.affectedCount > 0);
  
  // Calculate overall risk score
  const totalSuspicious = suspiciousTransactions.length;
  const riskRatio = totalSuspicious / validTransactions.length;
  const overallRiskScore = Math.min(
    Math.round((riskRatio * 100) + 
    (findings.reduce((sum, f) => 
      sum + (f.riskLevel === 'High' ? 20 : f.riskLevel === 'Medium' ? 10 : 5), 0))),
    100
  );
  
  // Format suspicious transactions for display
  const formattedSuspiciousTransactions = suspiciousTransactions
    .map(tx => ({
      id: tx.transaction_id,
      date: tx.date,
      amount: parseFloat(tx.amount),
      accountId: tx.account_id,
      merchant: tx.merchant_name,
      fraudType: tx.fraudType,
      riskScore: tx.riskScore
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 50); // Limit to top 50 suspicious transactions

  /**
   * Calculate loan eligibility based on transaction patterns and risk factors
   * 
   * @param transactions - All valid transactions
   * @param accountFrequency - Frequency of transactions by account
   * @param suspiciousTransactions - Transactions flagged as suspicious
   * @returns Loan eligibility assessment
   */
  function calculateLoanEligibility(transactions: any[], accountFrequency: Record<string, number>, suspiciousTransactions: any[]) {
    // Group transactions by account
    const accountTransactions: Record<string, any[]> = {};
    transactions.forEach(tx => {
      if (!accountTransactions[tx.account_id]) {
        accountTransactions[tx.account_id] = [];
      }
      accountTransactions[tx.account_id].push(tx);
    });
    
    // Track suspicious transactions by account
    const suspiciousByAccount: Record<string, number> = {};
    suspiciousTransactions.forEach(tx => {
      suspiciousByAccount[tx.account_id] = (suspiciousByAccount[tx.account_id] || 0) + 1;
    });
    
    // Calculate per-account metrics
    const accountAnalysis = Object.entries(accountTransactions).map(([accountId, txs]) => {
      // Calculate total deposits and withdrawals to estimate average balance
      let totalInflow = 0;
      let totalOutflow = 0;
      
      txs.forEach(tx => {
        const amount = parseFloat(tx.amount);
        if (tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer' || tx.transaction_type === 'income') {
          totalInflow += amount;
        } else {
          totalOutflow += amount;
        }
      });
      
      // Estimate average balance based on inflow and outflow
      const estimatedBalance = Math.max(totalInflow - totalOutflow, 0);
      
      // Transaction frequency assessment
      const transactionFrequency = txs.length;
      const transactionVelocity = 
        transactionFrequency > 15 ? 'high' :
        transactionFrequency > 7 ? 'medium' : 'low';
      
      // Cash flow stability (based on transaction patterns)
      // Higher stability = more consistent transaction sizes and regular patterns
      const transactionAmounts = txs.map(tx => parseFloat(tx.amount));
      const amountStdDev = calculateStandardDeviation(transactionAmounts);
      const amountMean = transactionAmounts.reduce((a, b) => a + b, 0) / transactionAmounts.length;
      const varianceCoefficient = amountMean ? amountStdDev / amountMean : 0;
      
      const cashFlowStability = 
        varianceCoefficient < 0.3 ? 'stable' :
        varianceCoefficient < 0.7 ? 'moderate' : 'unstable';
      
      // Risk level based on suspicious transactions
      const suspiciousCount = suspiciousByAccount[accountId] || 0;
      const suspiciousRatio = suspiciousCount / txs.length;
      
      const riskLevel = 
        suspiciousRatio > 0.1 ? 'high' :
        suspiciousRatio > 0.05 ? 'medium' : 'low';
      
      return {
        accountId,
        averageBalance: Math.round(estimatedBalance),
        cashFlowStability,
        transactionVelocity,
        riskLevel
      };
    });
    
    // Calculate overall eligibility score (0-100)
    // Base score starts at 70, and gets adjusted based on various factors
    let score = 70;
    
    // Impact of suspicious transactions
    const suspiciousRatio = suspiciousTransactions.length / transactions.length;
    score -= Math.round(suspiciousRatio * 100); // Deduct points based on suspicious ratio
    
    // Impact of account risk levels
    const highRiskAccounts = accountAnalysis.filter(a => a.riskLevel === 'high').length;
    const mediumRiskAccounts = accountAnalysis.filter(a => a.riskLevel === 'medium').length;
    score -= (highRiskAccounts * 15) + (mediumRiskAccounts * 5);
    
    // Impact of stability
    const stableAccounts = accountAnalysis.filter(a => a.cashFlowStability === 'stable').length;
    score += stableAccounts * 5; // Bonus for stable accounts
    
    // Impact of account balances
    const totalBalance = accountAnalysis.reduce((sum, acc) => sum + acc.averageBalance, 0);
    const averageAccountBalance = totalBalance / accountAnalysis.length;
    
    if (averageAccountBalance > 10000) score += 15;
    else if (averageAccountBalance > 5000) score += 10;
    else if (averageAccountBalance > 1000) score += 5;
    
    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Determine eligibility and max loan amount
    const isEligible = score >= 60;
    let maxLoanAmount = null;
    
    if (isEligible) {
      // Calculate max loan amount based on average balance and score
      maxLoanAmount = Math.round(totalBalance * (score / 100) * 1.5);
      // Ensure it's a reasonable value
      maxLoanAmount = Math.max(1000, Math.min(maxLoanAmount, 100000));
    }
    
    // Generate reason codes
    const reasonCodes = [];
    
    // Add positive factors
    if (stableAccounts > 0) {
      reasonCodes.push({
        code: 'STABLE_CASHFLOW',
        description: 'Consistent and stable transaction patterns',
        impact: 'positive' as const
      });
    }
    
    if (averageAccountBalance > 5000) {
      reasonCodes.push({
        code: 'SUFFICIENT_BALANCE',
        description: 'Adequate account balance maintained',
        impact: 'positive' as const
      });
    }
    
    if (suspiciousRatio < 0.05) {
      reasonCodes.push({
        code: 'LOW_RISK',
        description: 'Low risk transaction history',
        impact: 'positive' as const
      });
    }
    
    // Add negative factors
    if (highRiskAccounts > 0) {
      reasonCodes.push({
        code: 'HIGH_RISK_ACTIVITY',
        description: 'High risk transaction patterns detected',
        impact: 'negative' as const
      });
    }
    
    if (suspiciousRatio > 0.1) {
      reasonCodes.push({
        code: 'SUSPICIOUS_ACTIVITY',
        description: 'Higher than normal suspicious transactions',
        impact: 'negative' as const
      });
    }
    
    if (accountAnalysis.some(a => a.cashFlowStability === 'unstable')) {
      reasonCodes.push({
        code: 'UNSTABLE_CASHFLOW',
        description: 'Erratic transaction patterns observed',
        impact: 'negative' as const
      });
    }
    
    return {
      isEligible,
      score: Math.round(score),
      maxLoanAmount: isEligible ? maxLoanAmount : undefined,
      reasonCodes,
      accountAnalysis
    };
  }
  
  /**
   * Calculate standard deviation for an array of numbers
   */
  function calculateStandardDeviation(values: number[]): number {
    if (!values.length) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }
    
  // Calculate loan eligibility based on transaction data
  const loanEligibility = calculateLoanEligibility(validTransactions, accountFrequency, suspiciousTransactions);
  
  return {
    totalTransactions: validTransactions.length,
    suspiciousTransactions: totalSuspicious,
    overallRiskScore: overallRiskScore,
    findings: findings,
    transactionDetails: {
      suspiciousTransactions: formattedSuspiciousTransactions,
      topRiskMerchants: topRiskMerchants
    },
    loanEligibility: loanEligibility
  };
}
