import { prisma } from '@/lib/prisma';
import { AccountType, RiskLevel } from '@/app/generated/prisma';

export interface CibilScoreFactors {
  // Payment History (35% weight)
  paymentHistory: {
    onTimePayments: number;
    totalPayments: number;
    latePayments: number;
    defaultedPayments: number;
    score: number;
  };
  
  // Credit Utilization (30% weight)
  creditUtilization: {
    totalCredit: number;
    totalUtilized: number;
    utilizationRate: number;
    score: number;
  };
  
  // Credit History Length (15% weight)
  creditHistoryLength: {
    oldestAccountAge: number;
    averageAccountAge: number;
    totalAccounts: number;
    score: number;
  };
  
  // Credit Mix (10% weight)
  creditMix: {
    accountTypes: string[];
    institutionTypes: string[];
    diversityScore: number;
    score: number;
  };
  
  // New Credit (10% weight)
  newCredit: {
    recentEnquiries: number;
    newAccounts: number;
    timeSinceLastEnquiry: number;
    score: number;
  };
}

export interface CibilScoreResult {
  score: number;
  riskLevel: RiskLevel;
  factors: CibilScoreFactors;
  recommendations: string[];
  alerts: string[];
  confidence: number;
  lastUpdated: string;
}

export class CibilScoringEngine {
  private static readonly MIN_SCORE = 300;
  private static readonly MAX_SCORE = 850;
  private static readonly BASE_SCORE = 300;

  /**
   * Calculate CIBIL score based on Dojah API financial data
   */
  static async calculateCibilScore(
    userId: string,
    accountType: AccountType,
    dojahCreditData: any
  ): Promise<CibilScoreResult> {
    try {
      // Extract financial data from Dojah response
      const financialData = this.extractFinancialData(dojahCreditData);
      
      // Calculate individual factors
      const factors = this.calculateScoreFactors(financialData, accountType);
      
      // Calculate weighted score
      const score = this.calculateWeightedScore(factors);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(score);
      
      // Generate recommendations and alerts
      const recommendations = this.generateRecommendations(factors, score, accountType);
      const alerts = this.generateAlerts(financialData);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(financialData);
      
      // Save to database for consistency
      await this.saveCibilScore(userId, accountType, score, riskLevel, factors, dojahCreditData);
      
      return {
        score,
        riskLevel,
        factors,
        recommendations,
        alerts,
        confidence,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating CIBIL score:', error);
      throw new Error('Failed to calculate CIBIL score');
    }
  }

  /**
   * Extract financial data from Dojah API response
   */
  private static extractFinancialData(dojahData: any) {
    const score = dojahData?.entity?.score || {};
    
    return {
      // Loan history
      loans: score.loanHistory?.[0]?.value || [],
      loanPerformance: score.loanPerformance?.[0]?.value || [],
      
      // Credit enquiries
      enquiries: score.creditEnquiries?.[0]?.value || [],
      enquirySummary: score.creditEnquiriesSummary?.[0]?.value || {},
      
      // Summary data
      totalBorrowed: score.totalBorrowed?.[0]?.value || 0,
      totalOutstanding: score.totalOutstanding?.[0]?.value || 0,
      totalOverdue: score.totalOverdue?.[0]?.value || 0,
      totalActiveLoans: score.totalNoOfActiveLoans?.[0]?.value || 0,
      totalClosedLoans: score.totalNoOfClosedLoans?.[0]?.value || 0,
      totalDelinquent: score.totalNoOfDelinquentFacilities?.[0]?.value || 0,
      totalOverdueAccounts: score.totalNoOfOverdueAccounts?.[0]?.value || 0,
      totalInstitutions: score.totalNoOfInstitutions?.[0]?.value || 0,
      
      // Personal info
      personalInfo: dojahData?.entity || {}
    };
  }

  /**
   * Calculate individual score factors
   */
  private static calculateScoreFactors(financialData: any, accountType: AccountType): CibilScoreFactors {
    return {
      paymentHistory: this.calculatePaymentHistoryScore(financialData),
      creditUtilization: this.calculateCreditUtilizationScore(financialData),
      creditHistoryLength: this.calculateHistoryLengthScore(financialData),
      creditMix: this.calculateCreditMixScore(financialData, accountType),
      newCredit: this.calculateNewCreditScore(financialData)
    };
  }

  /**
   * Calculate payment history score (35% weight)
   */
  private static calculatePaymentHistoryScore(data: any) {
    const loans = data.loans || [];
    const performance = data.loanPerformance || [];
    
    let onTimePayments = 0;
    let totalPayments = 0;
    let latePayments = 0;
    let defaultedPayments = 0;
    
    // Analyze loan performance
    performance.forEach((loan: any) => {
      const performing = loan.noOfPerforming || 0;
      const nonPerforming = loan.noOfNonPerforming || 0;
      
      onTimePayments += performing;
      totalPayments += performing + nonPerforming;
      latePayments += nonPerforming;
      
      if (loan.performanceStatus === 'Non-performing') {
        defaultedPayments += nonPerforming;
      }
    });
    
    // Calculate score based on payment performance
    let score = 100;
    
    if (totalPayments > 0) {
      const onTimeRate = (onTimePayments / totalPayments) * 100;
      const lateRate = (latePayments / totalPayments) * 100;
      const defaultRate = (defaultedPayments / totalPayments) * 100;
      
      // Score calculation logic
      if (onTimeRate >= 95) score = 100;
      else if (onTimeRate >= 90) score = 90;
      else if (onTimeRate >= 80) score = 80;
      else if (onTimeRate >= 70) score = 70;
      else if (onTimeRate >= 60) score = 60;
      else if (onTimeRate >= 50) score = 40;
      else score = 20;
      
      // Penalty for defaults
      if (defaultRate > 0) {
        score = Math.max(0, score - (defaultRate * 2));
      }
    } else {
      score = 50; // Neutral score for no payment history
    }
    
    return {
      onTimePayments,
      totalPayments,
      latePayments,
      defaultedPayments,
      score: Math.round(score)
    };
  }

  /**
   * Calculate credit utilization score (30% weight)
   */
  private static calculateCreditUtilizationScore(data: any) {
    const totalBorrowed = data.totalBorrowed || 0;
    const totalOutstanding = data.totalOutstanding || 0;
    const totalOverdue = data.totalOverdue || 0;
    
    let utilizationRate = 0;
    if (totalBorrowed > 0) {
      utilizationRate = (totalOutstanding / totalBorrowed) * 100;
    }
    
    // Score calculation based on utilization rate
    let score = 100;
    
    if (utilizationRate <= 10) score = 100;
    else if (utilizationRate <= 20) score = 95;
    else if (utilizationRate <= 30) score = 90;
    else if (utilizationRate <= 40) score = 80;
    else if (utilizationRate <= 50) score = 70;
    else if (utilizationRate <= 60) score = 60;
    else if (utilizationRate <= 70) score = 50;
    else if (utilizationRate <= 80) score = 40;
    else if (utilizationRate <= 90) score = 30;
    else score = 20;
    
    // Penalty for overdue amounts
    if (totalOverdue > 0 && totalOutstanding > 0) {
      const overdueRate = (totalOverdue / totalOutstanding) * 100;
      score = Math.max(0, score - (overdueRate * 0.5));
    }
    
    return {
      totalCredit: totalBorrowed,
      totalUtilized: totalOutstanding,
      utilizationRate,
      score: Math.round(score)
    };
  }

  /**
   * Calculate credit history length score (15% weight)
   */
  private static calculateHistoryLengthScore(data: any) {
    const loans = data.loans || [];
    const totalAccounts = data.totalInstitutions || 0;
    
    let oldestAccountAge = 0;
    let totalAge = 0;
    
    // Calculate account ages
    loans.forEach((loan: any) => {
      if (loan.dateReported) {
        const accountAge = this.calculateAccountAge(loan.dateReported);
        oldestAccountAge = Math.max(oldestAccountAge, accountAge);
        totalAge += accountAge;
      }
    });
    
    const averageAccountAge = loans.length > 0 ? totalAge / loans.length : 0;
    
    // Score calculation
    let score = 50; // Base score
    
    // Bonus for account age
    if (oldestAccountAge >= 10) score += 30;
    else if (oldestAccountAge >= 7) score += 25;
    else if (oldestAccountAge >= 5) score += 20;
    else if (oldestAccountAge >= 3) score += 15;
    else if (oldestAccountAge >= 2) score += 10;
    else if (oldestAccountAge >= 1) score += 5;
    
    // Bonus for multiple accounts
    if (totalAccounts >= 5) score += 20;
    else if (totalAccounts >= 3) score += 15;
    else if (totalAccounts >= 2) score += 10;
    else if (totalAccounts >= 1) score += 5;
    
    return {
      oldestAccountAge,
      averageAccountAge,
      totalAccounts,
      score: Math.min(100, Math.round(score))
    };
  }

  /**
   * Calculate credit mix score (10% weight)
   */
  private static calculateCreditMixScore(data: any, accountType: AccountType) {
    const loans = data.loans || [];
    const enquiries = data.enquiries || [];
    
    const accountTypes = new Set(
      loans.map((loan: any) => loan.type).filter((x: any) => typeof x === 'string' && x.trim() !== '')
    );
    const institutions = new Set([
      ...loans.map((loan: any) => loan.loanProvider),
      ...enquiries.map((enquiry: any) => enquiry.loanProvider)
    ].filter((x: any) => typeof x === 'string' && x.trim() !== ''));
    
    let diversityScore = 0;
    
    // Account type diversity
    if (accountTypes.size >= 4) diversityScore += 40;
    else if (accountTypes.size >= 3) diversityScore += 30;
    else if (accountTypes.size >= 2) diversityScore += 20;
    else if (accountTypes.size >= 1) diversityScore += 10;
    
    // Institution diversity
    if (institutions.size >= 5) diversityScore += 40;
    else if (institutions.size >= 3) diversityScore += 30;
    else if (institutions.size >= 2) diversityScore += 20;
    else if (institutions.size >= 1) diversityScore += 10;
    
    // Bonus for business accounts
    if (accountType !== 'INDIVIDUAL') {
      diversityScore += 20;
    }
    
    return {
      accountTypes: Array.from(accountTypes).filter(Boolean) as string[],
      institutionTypes: Array.from(institutions).filter(Boolean) as string[],
      diversityScore,
      score: Math.min(100, diversityScore)
    };
  }

  /**
   * Calculate new credit score (10% weight)
   */
  private static calculateNewCreditScore(data: any) {
    const enquiries = data.enquiries || [];
    const enquirySummary = data.enquirySummary || {};
    
    const recentEnquiries = enquirySummary.Last3MonthCount || 0;
    const sixMonthEnquiries = enquirySummary.Last12MonthCount || 0;
    
    // Calculate time since last enquiry
    let timeSinceLastEnquiry = 999; // Default high value
    if (enquiries.length > 0) {
      const lastEnquiry = enquiries[0];
      if (lastEnquiry.date) {
        timeSinceLastEnquiry = this.calculateDaysSince(lastEnquiry.date);
      }
    }
    
    let score = 100;
    
    // Penalty for recent enquiries
    if (recentEnquiries >= 5) score -= 50;
    else if (recentEnquiries >= 3) score -= 30;
    else if (recentEnquiries >= 1) score -= 15;
    
    // Bonus for time since last enquiry
    if (timeSinceLastEnquiry >= 365) score += 20;
    else if (timeSinceLastEnquiry >= 180) score += 15;
    else if (timeSinceLastEnquiry >= 90) score += 10;
    else if (timeSinceLastEnquiry >= 30) score += 5;
    
    return {
      recentEnquiries,
      newAccounts: 0, // Not directly available in Dojah data
      timeSinceLastEnquiry,
      score: Math.max(0, Math.min(100, Math.round(score)))
    };
  }

  /**
   * Calculate weighted CIBIL score
   */
  private static calculateWeightedScore(factors: CibilScoreFactors): number {
    const weightedScore = 
      (factors.paymentHistory.score * 0.35) +
      (factors.creditUtilization.score * 0.30) +
      (factors.creditHistoryLength.score * 0.15) +
      (factors.creditMix.score * 0.10) +
      (factors.newCredit.score * 0.10);
    
    // Convert to 300-850 scale
    const score = this.BASE_SCORE + (weightedScore * (this.MAX_SCORE - this.BASE_SCORE) / 100);
    
    return Math.round(score);
  }

  /**
   * Determine risk level based on score
   */
  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= 750) return RiskLevel.LOW;
    if (score >= 650) return RiskLevel.MEDIUM;
    if (score >= 550) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(factors: CibilScoreFactors, score: number, accountType: AccountType): string[] {
    const recommendations: string[] = [];
    
    // Payment history recommendations
    if (factors.paymentHistory.score < 80) {
      recommendations.push('Make all payments on time to improve your payment history score');
    }
    
    // Credit utilization recommendations
    if (factors.creditUtilization.score < 70) {
      recommendations.push('Reduce your credit utilization by paying down outstanding balances');
    }
    
    // Credit history recommendations
    if (factors.creditHistoryLength.score < 60) {
      recommendations.push('Maintain existing credit accounts to build longer credit history');
    }
    
    // Credit mix recommendations
    if (factors.creditMix.score < 60) {
      recommendations.push('Consider diversifying your credit mix with different types of accounts');
    }
    
    // New credit recommendations
    if (factors.newCredit.score < 80) {
      recommendations.push('Limit new credit applications to avoid multiple hard inquiries');
    }
    
    // Account type specific recommendations
    if (accountType !== 'INDIVIDUAL') {
      recommendations.push('Maintain good business credit practices for better corporate credit standing');
    }
    
    // General score recommendations
    if (score < 650) {
      recommendations.push('Work on improving your overall credit score to qualify for better rates');
    }
    
    return recommendations;
  }

  /**
   * Generate alerts
   */
  private static generateAlerts(financialData: any): string[] {
    const alerts: string[] = [];
    
    // Overdue accounts alert
    if (financialData.totalOverdueAccounts > 0) {
      alerts.push(`You have ${financialData.totalOverdueAccounts} overdue account(s)`);
    }
    
    // High utilization alert
    if (financialData.totalOutstanding > 0 && financialData.totalBorrowed > 0) {
      const utilization = (financialData.totalOutstanding / financialData.totalBorrowed) * 100;
      if (utilization > 70) {
        alerts.push(`High credit utilization detected (${utilization.toFixed(1)}%)`);
      }
    }
    
    // Recent enquiries alert
    const recentEnquiries = financialData.enquirySummary?.Last3MonthCount || 0;
    if (recentEnquiries >= 3) {
      alerts.push(`Multiple credit enquiries detected in the last 3 months (${recentEnquiries})`);
    }
    
    return alerts;
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(financialData: any): number {
    let confidence = 100;
    
    // Reduce confidence for limited data
    if (!financialData.loans || financialData.loans.length === 0) {
      confidence -= 30;
    }
    
    if (!financialData.enquiries || financialData.enquiries.length === 0) {
      confidence -= 20;
    }
    
    if (financialData.totalBorrowed === 0) {
      confidence -= 25;
    }
    
    return Math.max(0, confidence);
  }

  /**
   * Save CIBIL score to database
   */
  private static async saveCibilScore(
    userId: string,
    accountType: AccountType,
    score: number,
    riskLevel: RiskLevel,
    factors: CibilScoreFactors,
    dojahData: any
  ): Promise<void> {
    try {
      // Create or update credit score
      const existingScore = await prisma.creditScore.findUnique({
        where: { userId }
      });

      if (existingScore) {
        const scoreChange = score - existingScore.currentScore;
        
        await prisma.creditScore.update({
          where: { userId },
          data: {
            currentScore: score,
            previousScore: existingScore.currentScore,
            scoreChange,
            lastUpdated: new Date()
          }
        });

        // Add to history
        await prisma.creditScoreHistory.create({
          data: {
            creditScoreId: existingScore.id,
            score,
            changeReason: this.getScoreChangeReason(scoreChange),
            factors: factors as any
          }
        });
      } else {
        await prisma.creditScore.create({
          data: {
            userId,
            accountType,
            currentScore: score,
            lastUpdated: new Date()
          }
        });
      }

      // Save credit bureau check
      await prisma.creditBureauCheck.create({
        data: {
          userId,
          bvn: dojahData.entity?.bvn || '',
          accountType,
          creditScore: score,
          riskScore: this.calculateRiskScore(score),
          riskLevel,
          responseData: dojahData,
          extractedData: factors as any
        }
      });

      // Save credit factors
      await prisma.creditFactor.createMany({
        data: [
          {
            userId,
            factorType: 'Payment History',
            factorValue: factors.paymentHistory.score,
            factorWeight: 0.35,
            impact: factors.paymentHistory.score >= 80 ? 'Positive' : factors.paymentHistory.score >= 60 ? 'Neutral' : 'Negative',
            description: `On-time payments: ${factors.paymentHistory.onTimePayments}/${factors.paymentHistory.totalPayments}`
          },
          {
            userId,
            factorType: 'Credit Utilization',
            factorValue: factors.creditUtilization.score,
            factorWeight: 0.30,
            impact: factors.creditUtilization.score >= 80 ? 'Positive' : factors.creditUtilization.score >= 60 ? 'Neutral' : 'Negative',
            description: `Utilization rate: ${factors.creditUtilization.utilizationRate.toFixed(1)}%`
          },
          {
            userId,
            factorType: 'Credit History Length',
            factorValue: factors.creditHistoryLength.score,
            factorWeight: 0.15,
            impact: factors.creditHistoryLength.score >= 80 ? 'Positive' : factors.creditHistoryLength.score >= 60 ? 'Neutral' : 'Negative',
            description: `Oldest account: ${factors.creditHistoryLength.oldestAccountAge} years`
          },
          {
            userId,
            factorType: 'Credit Mix',
            factorValue: factors.creditMix.score,
            factorWeight: 0.10,
            impact: factors.creditMix.score >= 80 ? 'Positive' : factors.creditMix.score >= 60 ? 'Neutral' : 'Negative',
            description: `Account types: ${factors.creditMix.accountTypes.length}`
          },
          {
            userId,
            factorType: 'New Credit',
            factorValue: factors.newCredit.score,
            factorWeight: 0.10,
            impact: factors.newCredit.score >= 80 ? 'Positive' : factors.newCredit.score >= 60 ? 'Neutral' : 'Negative',
            description: `Recent enquiries: ${factors.newCredit.recentEnquiries}`
          }
        ]
      });

    } catch (error) {
      console.error('Error saving CIBIL score:', error);
      throw new Error('Failed to save CIBIL score');
    }
  }

  /**
   * Get score change reason
   */
  private static getScoreChangeReason(scoreChange: number): string {
    if (scoreChange > 0) return 'Score improved';
    if (scoreChange < 0) return 'Score decreased';
    return 'No change';
  }

  /**
   * Calculate risk score (0-100)
   */
  private static calculateRiskScore(creditScore: number): number {
    if (creditScore >= 750) return 0;
    if (creditScore >= 650) return 25;
    if (creditScore >= 550) return 50;
    if (creditScore >= 450) return 75;
    return 100;
  }

  /**
   * Calculate account age in years
   */
  private static calculateAccountAge(dateString: string): number {
    const accountDate = new Date(dateString);
    const now = new Date();
    return (now.getTime() - accountDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  }

  /**
   * Calculate days since date
   */
  private static calculateDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Get user's CIBIL score
   */
  static async getUserCibilScore(userId: string): Promise<CibilScoreResult | null> {
    try {
      const creditScore = await prisma.creditScore.findUnique({
        where: { userId },
        include: {
          scoreHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!creditScore) {
        return null;
      }

      const latestFactors = await prisma.creditFactor.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Reconstruct factors from database
      const factors: CibilScoreFactors = {
        paymentHistory: { onTimePayments: 0, totalPayments: 0, latePayments: 0, defaultedPayments: 0, score: 0 },
        creditUtilization: { totalCredit: 0, totalUtilized: 0, utilizationRate: 0, score: 0 },
        creditHistoryLength: { oldestAccountAge: 0, averageAccountAge: 0, totalAccounts: 0, score: 0 },
        creditMix: { accountTypes: [], institutionTypes: [], diversityScore: 0, score: 0 },
        newCredit: { recentEnquiries: 0, newAccounts: 0, timeSinceLastEnquiry: 0, score: 0 }
      };

      // Map database factors to structure
      latestFactors.forEach(factor => {
        switch (factor.factorType) {
          case 'Payment History':
            factors.paymentHistory.score = factor.factorValue;
            break;
          case 'Credit Utilization':
            factors.creditUtilization.score = factor.factorValue;
            break;
          case 'Credit History Length':
            factors.creditHistoryLength.score = factor.factorValue;
            break;
          case 'Credit Mix':
            factors.creditMix.score = factor.factorValue;
            break;
          case 'New Credit':
            factors.newCredit.score = factor.factorValue;
            break;
        }
      });

      return {
        score: creditScore.currentScore,
        riskLevel: this.determineRiskLevel(creditScore.currentScore),
        factors,
        recommendations: [],
        alerts: [],
        confidence: 100,
        lastUpdated: creditScore.lastUpdated.toISOString()
      };
    } catch (error) {
      console.error('Error getting user CIBIL score:', error);
      throw new Error('Failed to get CIBIL score');
    }
  }

  /**
   * Calculate CIBIL score from BVN by fetching Dojah data first
   */
  static async calculateCibilScoreFromBvn(
    userId: string,
    bvn: string,
    accountType: AccountType
  ): Promise<{ success: boolean; data?: CibilScoreResult; error?: string }> {
    try {
      // Fetch credit bureau data from Dojah API
      const dojahResponse = await fetch(`${process.env.DOJAH_BASE_URL || 'https://api.dojah.io'}/api/v1/credit_bureau?bvn=${bvn}`, {
        method: 'GET',
        headers: {
          'Authorization': process.env.DOJAH_SECRET_KEY || '',
          'AppId': process.env.DOJAH_APP_ID || '',
          'Content-Type': 'application/json',
        },
      });

      if (!dojahResponse.ok) {
        let errorMessage = 'Failed to fetch credit bureau data';
        try {
          const errorData = await dojahResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Use default error message
        }
        return { success: false, error: errorMessage };
      }

      const dojahData = await dojahResponse.json();

      // Calculate CIBIL score using the fetched data
      const result = await this.calculateCibilScore(userId, accountType, dojahData);

      return { success: true, data: result };
    } catch (error) {
      console.error('Error calculating CIBIL score from BVN:', error);
      return { success: false, error: 'Failed to calculate CIBIL score' };
    }
  }
} 