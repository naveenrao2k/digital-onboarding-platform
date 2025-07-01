# Complete CIBIL System for Nigeria

## Overview

This document describes the comprehensive CIBIL (Credit Information Bureau) system implemented for Nigeria using Dojah API. The system provides dynamic, consistent credit scoring for all account types with full-proof logic that ensures the same data always produces the same score.

## 🏗️ System Architecture

### Core Components

1. **CIBIL Scoring Engine** (`lib/cibil-scoring-engine.ts`)
2. **Dynamic Credit Score Component** (`components/dashboard/CreditScore.tsx`)
3. **CIBIL Score API** (`app/api/user/cibil-score/route.ts`)
4. **Database Schema** (Enhanced Prisma models)

## 📊 CIBIL Scoring Algorithm

### 5-Factor Credit Scoring Model

The system uses a comprehensive 5-factor model with Nigerian market considerations:

#### 1. Payment History (35% Weight)
- **On-time Payments**: Percentage of payments made on time
- **Late Payments**: Number of late payments
- **Defaulted Payments**: Number of defaulted accounts
- **Score Calculation**: Based on payment performance ratio

```typescript
// Payment History Score Logic
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
```

#### 2. Credit Utilization (30% Weight)
- **Total Credit**: Total credit available
- **Total Utilized**: Total credit used
- **Utilization Rate**: Percentage of credit used
- **Overdue Amount**: Amount overdue

```typescript
// Credit Utilization Score Logic
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
```

#### 3. Credit History Length (15% Weight)
- **Oldest Account Age**: Age of oldest credit account
- **Average Account Age**: Average age of all accounts
- **Total Accounts**: Number of credit accounts

```typescript
// Credit History Length Score Logic
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
```

#### 4. Credit Mix (10% Weight)
- **Account Types**: Diversity of credit account types
- **Institution Types**: Number of different institutions
- **Business Bonus**: Additional points for business accounts

```typescript
// Credit Mix Score Logic
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
```

#### 5. New Credit (10% Weight)
- **Recent Enquiries**: Number of credit enquiries in last 3 months
- **Time Since Last Enquiry**: Days since last credit enquiry
- **Enquiry Frequency**: Penalty for multiple recent enquiries

```typescript
// New Credit Score Logic
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
```

### Final Score Calculation

```typescript
const weightedScore = 
  (factors.paymentHistory.score * 0.35) +
  (factors.creditUtilization.score * 0.30) +
  (factors.creditHistoryLength.score * 0.15) +
  (factors.creditMix.score * 0.10) +
  (factors.newCredit.score * 0.10);

// Convert to 300-850 scale
const score = 300 + (weightedScore * (850 - 300) / 100);
```

## 🎯 Account Type Support

### Individual Accounts
- Standard 5-factor scoring
- Personal credit history focus
- Payment history emphasis

### Partnership Accounts
- Business credit assessment
- Enhanced scoring for business creditworthiness
- Corporate reference validation

### Enterprise Accounts
- Complex business credit analysis
- Multiple stakeholder consideration
- Enhanced risk assessment

### Limited Liability Companies (LLC)
- Corporate credit scoring
- Board resolution analysis
- Tax compliance consideration

## 🔄 Dynamic Score Updates

### Real-time Calculation
The system calculates scores dynamically based on:
1. **Dojah API Data**: Fresh credit bureau data
2. **Account Type**: Different scoring for different account types
3. **Historical Data**: Previous score comparisons
4. **Consistency**: Same data always produces same score

### Score Consistency Logic

```typescript
// Deterministic scoring ensures consistency
const calculateCibilScore = async (userId, accountType, dojahData) => {
  // Extract financial data consistently
  const financialData = extractFinancialData(dojahData);
  
  // Calculate factors using deterministic algorithms
  const factors = calculateScoreFactors(financialData, accountType);
  
  // Apply consistent weighting
  const score = calculateWeightedScore(factors);
  
  // Save to database for consistency
  await saveCibilScore(userId, accountType, score, factors, dojahData);
  
  return score;
};
```

## 📱 User Interface

### Dynamic Credit Score Component

The `CreditScore` component now:
- **Fetches Real Data**: Gets actual CIBIL scores from database
- **Shows Loading States**: Displays loading while fetching data
- **Error Handling**: Graceful error handling with fallbacks
- **Score Factors**: Displays individual factor scores
- **Trend Information**: Shows score changes over time

### Features
- **Real-time Updates**: Automatically refreshes when new data is available
- **Score Breakdown**: Shows individual factor contributions
- **Visual Indicators**: Color-coded score ranges
- **Responsive Design**: Works on all device sizes

## 🗄️ Database Storage

### Credit Score Models

```prisma
model CreditScore {
  id            String    @id @default(cuid())
  userId        String    @unique
  accountType   AccountType
  currentScore  Int       @default(300)
  previousScore Int?
  scoreChange   Int?
  lastUpdated   DateTime  @default(now())
  scoreHistory  CreditScoreHistory[]
  user          User      @relation(fields: [userId], references: [id])
}

model CreditScoreHistory {
  id            String    @id @default(cuid())
  creditScoreId String
  score         Int
  changeReason  String?
  factors       Json?
  createdAt     DateTime  @default(now())
  creditScore   CreditScore @relation(fields: [creditScoreId], references: [id])
}

model CreditFactor {
  id          String    @id @default(cuid())
  userId      String
  factorType  String
  factorValue Float
  factorWeight Float
  impact      String
  description String?
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
}
```

## 🔌 API Endpoints

### CIBIL Score API

#### GET `/api/user/cibil-score`
- **Purpose**: Fetch user's CIBIL score
- **Parameters**: `refresh=true` (optional, force refresh)
- **Response**: CIBIL score with factors and recommendations

#### POST `/api/user/cibil-score`
- **Purpose**: Calculate new CIBIL score with fresh data
- **Body**: `{ "bvn": "12345678901" }`
- **Response**: Newly calculated CIBIL score

### Example Usage

```typescript
// Fetch existing score
const response = await fetch('/api/user/cibil-score');
const { data: cibilScore } = await response.json();

// Calculate new score with fresh data
const response = await fetch('/api/user/cibil-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bvn: '12345678901' })
});
const { data: newScore } = await response.json();
```

## 🔒 Data Consistency

### Deterministic Algorithm
The scoring algorithm is designed to be deterministic:
- **Same Input**: Always produces same output
- **No Randomness**: No random factors in calculation
- **Reproducible**: Can be reproduced with same data
- **Stored Results**: All calculations stored in database

### Score Validation
```typescript
// Validate score consistency
const validateScore = (userId, dojahData) => {
  const score1 = await calculateCibilScore(userId, accountType, dojahData);
  const score2 = await calculateCibilScore(userId, accountType, dojahData);
  
  // Should always be equal
  return score1 === score2;
};
```

## 🚀 Implementation Steps

### 1. Database Migration
```bash
npx prisma migrate dev --name "add-cibil-scoring-models"
npx prisma generate
```

### 2. Environment Variables
```env
# Dojah API Configuration
DOJAH_APP_ID=your_app_id
DOJAH_SECRET_KEY=your_secret_key
DOJAH_PUBLIC_KEY=your_public_key
DOJAH_ENVIRONMENT=production
DOJAH_BASE_URL=https://api.dojah.io
```

### 3. Component Usage
```tsx
// In your dashboard
<CreditScore darkMode={darkMode} />

// With custom props
<CreditScore 
  darkMode={darkMode} 
  showDetails={true}
  className="custom-class"
/>
```

### 4. API Integration
```typescript
// Calculate score for user
const cibilScore = await CibilScoringEngine.calculateCibilScore(
  userId,
  accountType,
  dojahData
);

// Get existing score
const existingScore = await CibilScoringEngine.getUserCibilScore(userId);
```

## 📈 Benefits

### ✅ Consistent Scoring
- Same data always produces same score
- Deterministic algorithm
- Reproducible results

### ✅ Multi-Account Support
- Individual accounts
- Partnership accounts
- Enterprise accounts
- LLC accounts

### ✅ Real-time Updates
- Dynamic score calculation
- Live data from Dojah API
- Automatic score updates

### ✅ Comprehensive Analysis
- 5-factor scoring model
- Nigerian market considerations
- Business account enhancements

### ✅ User-Friendly Interface
- Visual score display
- Factor breakdown
- Trend analysis
- Responsive design

## 🔧 Troubleshooting

### Common Issues

1. **Score Not Loading**
   - Check Dojah API credentials
   - Verify user has credit bureau data
   - Check database connection

2. **Inconsistent Scores**
   - Ensure deterministic algorithm
   - Check for data changes
   - Verify calculation logic

3. **API Errors**
   - Check Dojah API status
   - Verify BVN format
   - Check network connectivity

### Debug Mode
```typescript
// Enable debug logging
const debugScore = await CibilScoringEngine.calculateCibilScore(
  userId,
  accountType,
  dojahData,
  { debug: true }
);
```

## 📊 Monitoring

### Score Tracking
- Historical score changes
- Factor analysis
- Trend monitoring
- Alert generation

### Performance Metrics
- Calculation time
- API response times
- Database query performance
- User engagement

This CIBIL system provides a complete, consistent, and reliable credit scoring solution for Nigeria with full-proof logic that ensures the same financial data always produces the same score across all account types. 