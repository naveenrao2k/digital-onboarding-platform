// Mock credit data for development and testing when Dojah API is unavailable
// This allows developers to test the UI and integration without depending on external services

export const generateMockCreditData = (bvn: string) => {
  // Create deterministic but realistic data based on BVN
  const lastDigit = parseInt(bvn.charAt(bvn.length - 1), 10);
  const secondLastDigit = parseInt(bvn.charAt(bvn.length - 2), 10);
  
  // Use the last digits to determine risk profile (for testing different scenarios)
  const riskLevel = lastDigit > 7 ? 'high' : lastDigit > 4 ? 'medium' : 'low';
  
  // Generate number of loans based on second-last digit
  const totalLoans = 1 + (secondLastDigit % 5);
  const activeLoans = secondLastDigit % 3;
  const closedLoans = totalLoans - activeLoans;
  
  // Generate overdue accounts based on risk level
  const overdueAccounts = riskLevel === 'high' ? 2 : riskLevel === 'medium' ? 1 : 0;
  
  // Generate financial values
  const totalBorrowed = 500000 + (parseInt(bvn.substring(5, 8)) * 10000);
  const outstandingBalance = riskLevel === 'high' ? totalBorrowed * 0.7 : 
                            riskLevel === 'medium' ? totalBorrowed * 0.4 : 
                            totalBorrowed * 0.2;
  const overdueAmount = riskLevel === 'high' ? outstandingBalance * 0.4 : 
                        riskLevel === 'medium' ? outstandingBalance * 0.15 : 
                        0;
  
  // Generate mock loan history
  const loanHistory = [];
  for (let i = 0; i < totalLoans; i++) {
    const isActive = i < activeLoans;
    const isPerforming = !(riskLevel === 'high' && i === 0) && !(riskLevel === 'medium' && i === 0 && !isActive);
    
    loanHistory.push({
      loanProvider: ['Access Bank', 'GTBank', 'First Bank', 'UBA', 'Wema Bank'][i % 5],
      type: ['Personal Loan', 'Mortgage', 'Auto Loan', 'Business Loan'][i % 4],
      loanAmount: String(100000 + (i * 50000)),
      status: isActive ? 'Open' : 'Closed',
      performanceStatus: isPerforming ? 'Performing' : 'Non-performing',
      dateReported: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      accountNumber: `${100000 + parseInt(bvn.substring(i, i+5))}`,
      lastPaymentDate: new Date(Date.now() - ((i+1) * 5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      installmentAmount: String(5000 + (i * 2500)),
      outstandingBalance: String(isActive ? (100000 + (i * 50000)) * 0.6 : 0),
      overdueAmount: String(isPerforming ? 0 : (100000 + (i * 50000)) * 0.2),
      paymentHistory: [],
    });
  }
  
  // Generate mock loan performance data
  const loanPerformance = loanHistory.map((loan, index) => ({
    loanProvider: loan.loanProvider,
    accountNumber: loan.accountNumber,
    loanAmount: parseInt(loan.loanAmount),
    loanCount: 1,
    noOfNonPerforming: loan.performanceStatus === 'Non-performing' ? 1 : 0,
    noOfPerforming: loan.performanceStatus === 'Performing' ? 1 : 0,
    outstandingBalance: parseInt(loan.outstandingBalance),
    overdueAmount: parseInt(loan.overdueAmount),
    performanceStatus: loan.performanceStatus,
    status: loan.status
  }));
  
  // Generate mock credit enquiries
  const enquiries = [];
  for (let i = 0; i < (lastDigit % 5); i++) {
    enquiries.push({
      loanProvider: ['Access Bank', 'GTBank', 'First Bank', 'UBA', 'Wema Bank'][(i + lastDigit) % 5],
      date: new Date(Date.now() - (i * 15 * 24 * 60 * 60 * 1000)).toISOString(),
      reason: ['New loan application', 'Credit limit increase', 'Account review'][i % 3],
      contactPhone: `+234${9000000000 + parseInt(bvn.substring(i, i+7))}`
    });
  }
  
  // Return mock credit data in Dojah format
  return {
    entity: {
      address: "123 Mock Street, Lagos, Nigeria",
      bvn: bvn,
      dateOfBirth: "1980-01-01",
      email: `user${bvn.substring(0, 4)}@example.com`,
      gender: Math.random() > 0.5 ? "Male" : "Female",
      name: `Mock User ${bvn.substring(0, 4)}`,
      phone: `+234${9000000000 + parseInt(bvn.substring(0, 7))}`,
      searchedDate: new Date().toISOString(),
      score: {
        bureauStatus: {
          crc: "Available",
          creditRegistry: "Available",
          firstCentral: "Available",
        },
        creditEnquiries: [
          {
            source: "crc",
            value: enquiries
          }
        ],
        creditEnquiriesSummary: [
          {
            source: "crc",
            value: {
              Last3MonthCount: String(lastDigit % 3),
              Last12MonthCount: String(lastDigit % 5),
              Last36MonthCount: String(lastDigit % 7)
            }
          }
        ],
        loanHistory: [
          {
            source: "crc",
            value: loanHistory
          }
        ],
        loanPerformance: [
          {
            source: "crc",
            value: loanPerformance
          }
        ],
        totalBorrowed: [
          {
            source: "crc",
            value: totalBorrowed
          }
        ],
        totalMonthlyInstallment: [
          {
            source: "crc",
            value: totalBorrowed * 0.05
          }
        ],
        totalNoOfActiveLoans: [
          {
            source: "crc",
            value: activeLoans
          }
        ],
        totalNoOfClosedLoans: [
          {
            source: "crc",
            value: closedLoans
          }
        ],
        totalNoOfDelinquentFacilities: [
          {
            source: "crc",
            value: riskLevel === 'high' ? 1 : 0
          }
        ],
        totalNoOfInstitutions: [
          {
            source: "crc",
            value: Math.min(totalLoans, 3)
          }
        ],
        totalNoOfLoans: [
          {
            source: "crc",
            value: totalLoans
          }
        ],
        totalNoOfOverdueAccounts: [
          {
            source: "crc",
            value: overdueAccounts
          }
        ],
        totalNoOfPerformingLoans: [
          {
            source: "crc",
            value: totalLoans - overdueAccounts
          }
        ],
        totalOutstanding: [
          {
            source: "crc",
            value: outstandingBalance
          }
        ],
        totalOverdue: [
          {
            source: "crc",
            value: overdueAmount
          }
        ],
      }
    }
  };
};
