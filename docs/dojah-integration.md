# Dojah Integration: Complete End-to-End Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [User Journey](#user-journey)
4. [Admin Review Process](#admin-review-process)
5. [Technical Implementation](#technical-implementation)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [UI Components](#ui-components)
9. [Security & Compliance](#security--compliance)
10. [Error Handling](#error-handling)
11. [Configuration Guide](#configuration-guide)
12. [Troubleshooting](#troubleshooting)
13. [Future Enhancements](#future-enhancements)

## Introduction

This document provides comprehensive documentation of the Dojah integration in our Digital Onboarding Platform. The integration enables automated document verification, selfie verification, and identity validation against Nigeria's government databases.

### Purpose
- Automate KYC (Know Your Customer) verification processes
- Validate user identity documents against official Nigerian government records
- Streamline admin review workflows with AI-powered document analysis
- Ensure regulatory compliance for financial services

### Key Features
- Document analysis and data extraction
- Selfie verification with liveness detection
- Government database lookups (BVN, NIN, Passport, Driver's License)
- AML (Anti-Money Laundering) screening
- Admin review interface with verification results

## Architecture Overview

### System Components

```
┌───────────────────┐     ┌────────────────┐     ┌────────────────┐
│ User Interface    │     │ Next.js API    │     │ Dojah API      │
│ - Document Upload │────▶│ - Processing   │────▶│ - Verification │
│ - Selfie Capture  │     │ - Verification │     │ - Gov't Lookups│
└───────────────────┘     └────────────────┘     └────────────────┘
                                  │
                                  ▼
                          ┌────────────────┐     ┌────────────────┐
                          │ Database       │     │ Admin Interface │
                          │ - User Data    │────▶│ - Review Queue  │
                          │ - Verifications│     │ - Decision UI   │
                          └────────────────┘     └────────────────┘
```

### Integration Flow
1. **User Upload** → Documents and selfie captured in frontend
2. **API Processing** → Files analyzed and submitted to Dojah
3. **Verification** → Dojah performs document analysis and identity verification
4. **Database Storage** → Results stored in PostgreSQL via Prisma
5. **Admin Review** → Verification results displayed for admin decision
6. **Status Update** → User notified of verification outcome

## User Journey

### 1. Document Upload
The user journey begins on the document upload page where users submit their identity documents based on their account type.

**Process:**
1. User navigates to `/user/upload-kyc-documents`
2. Selects their account type (Individual, Partnership, Enterprise, LLC)
3. Uploads required documents (ID Card, Passport, etc.)
4. System stores documents in chunks for large files
5. Frontend displays upload progress in real-time

**Behind the Scenes:**
- Documents are uploaded to `/api/user/kyc-document` endpoint
- `uploadKycDocument` function in `kyc-service.ts` handles storage
- Dojah verification is triggered automatically after upload

### 2. Document Analysis
Once documents are uploaded, the system initiates document analysis.

**Process:**
1. Document is converted to base64 format
2. System calls `dojahService.verifyDocument()` function
3. Document is submitted to Dojah's document analysis API
4. Text extraction and quality assessment performed
5. Results stored in `DocumentAnalysis` table

**Key Features:**
- Document type detection
- Text extraction using OCR
- Quality assessment (blurriness, readability)
- Confidence scoring for extracted data

### 3. Government Database Lookups
If document analysis successfully extracts identity information, the system performs government database lookups.

**Process:**
1. System identifies document type and extracted data
2. Appropriate lookup function is called based on document type:
   - BVN: `lookupBVN()`
   - NIN: `lookupNIN()`
   - Passport: `lookupPassport()`
   - Driver's License: `lookupDriversLicense()`
3. Results stored in `DojahVerification` table with match status
4. User verification status updated accordingly

**Supported Lookups:**
- Bank Verification Number (BVN)
- National Identification Number (NIN)
- International Passport
- Driver's License

### 4. Selfie Verification
After document upload, users complete selfie verification.

**Process:**
1. User navigates to `/user/selfie-verification`
2. Captures selfie using webcam
3. System uploads selfie to `/api/user/selfie-verification`
4. If ID document with photo available, facial match performed
5. Liveness detection confirms real person (not photo)
6. Results stored in database with confidence score

**Technical Implementation:**
- Webcam capture using browser APIs
- Face detection overlay ensures proper positioning
- Dojah's selfie-to-photo ID matching API used
- Results linked to user's verification status

### 5. Verification Status Tracking
Users can track their verification progress in real-time.

**Process:**
1. User visits `/user/verification-status`
2. System retrieves verification status from database
3. Progress displayed with visual indicators
4. User can see which documents are verified/pending/rejected
5. Nigeria validation results shown if available

**Status Types:**
- `PENDING`: Initial state for new uploads
- `IN_PROGRESS`: Documents submitted, verification ongoing
- `APPROVED`: Verification successful
- `REJECTED`: Verification failed, details provided
- `REQUIRES_REUPLOAD`: Document rejected, reupload requested

## Admin Review Process

### 1. Submission Queue
Admins first see new submissions in their review queue.

**Process:**
1. Admin logs in at `/admin/login`
2. Views submission queue at `/admin/submissions`
3. Queue shows pending items sorted by priority
4. Admin selects a user to review their submission

**Queue Management:**
- Sorting by date, status, and document type
- Filtering by verification status
- Highlighting time-sensitive applications
- Batch processing capabilities

### 2. Document Verification Review
Admin reviews document verification results in detail.

**Process:**
1. Admin navigates to `/admin/users/[id]`
2. Views user profile and verification status
3. Sees Dojah verification results with confidence scores
4. Examines government database match results
5. Makes approval/rejection decision

**Review Interface Components:**
- Document preview with zoom capability
- Extracted data visualization
- Confidence scores and match results
- Data comparison (extracted vs. government records)
- Decision buttons (Approve, Reject, Request More Info)

### 3. Verification Decision
Admin makes final verification decisions based on all available information.

**Process:**
1. Reviews all verification results
2. For rejection, provides reason and determines if reupload allowed
3. For approval, verification is marked complete
4. System updates status and notifies user
5. Audit log created for compliance purposes

**Decision Options:**
- `APPROVED`: Verification confirmed, user can proceed
- `REJECTED`: Verification failed, with detailed reason
- `REQUIRES_ADDITIONAL_INFO`: More information needed
- `REQUIRES_REUPLOAD`: Document rejected, new upload requested

### 4. Audit Trail
All admin actions are recorded in the audit trail.

**Process:**
1. Each admin action logged with timestamp and details
2. Audit logs viewable at `/admin/audit-logs`
3. Logs searchable by user, action, date
4. Export functionality for compliance reporting

**Logged Information:**
- Admin ID and name
- Action performed
- Target user/document
- Decision details
- Timestamp

## Technical Implementation

### Core Services

#### 1. Dojah Service (`lib/dojah-service.ts`)
The central service handling all Dojah API interactions.

**Key Functions:**
- `verifyDocument()`: Main document verification pipeline
- `verifySelfie()`: Selfie verification with optional ID matching
- `lookupBVN()`, `lookupNIN()`, etc.: Government database lookups
- `analyzeDocument()`: Document analysis and data extraction
- `performAMLScreening()`: Anti-money laundering checks

**Configuration:**
- API credentials from environment variables
- Auto-switching between sandbox and production
- Error handling and retry logic

#### 2. KYC Service (`lib/kyc-service.ts`)
Handles document upload and verification status management.

**Key Functions:**
- `uploadKycDocument()`: Document storage and chunking
- `uploadSelfieVerification()`: Selfie storage and processing
- `getVerificationStatus()`: Retrieves current verification status
- Integration with Dojah service for verification

#### 3. File Upload Service (`lib/file-upload-service.ts`)
Manages file uploads, chunking, and storage.

**Key Functions:**
- File chunking for large documents
- MIME type validation
- File size limits
- Storage optimization

### API Endpoints

#### User Endpoints

1. **Document Analysis API** (`/api/user/document-analysis`)
   - **Method**: POST
   - **Purpose**: Analyzes uploaded documents
   - **Request**: Document ID, base64 content, document type
   - **Response**: Verification ID and status

2. **Dojah Verification API** (`/api/user/dojah-verification`)
   - **Method**: POST/GET
   - **Purpose**: Triggers/retrieves verification results
   - **Request**: Verification type, document data
   - **Response**: Verification results or status

3. **Nigeria Validation API** (`/api/user/nigeria-validation`)
   - **Method**: POST/GET 
   - **Purpose**: Performs/retrieves Nigeria database lookups
   - **Request**: ID numbers (BVN, NIN, etc.)
   - **Response**: Validation results with match status

4. **Verification Status API** (`/api/user/verification-status`)
   - **Method**: GET
   - **Purpose**: Retrieves current verification status
   - **Response**: Overall status, progress, and details

#### Admin Endpoints

1. **User Details API** (`/api/admin/users/[id]`)
   - **Method**: GET
   - **Purpose**: Retrieves detailed user information
   - **Response**: User profile, documents, verification results

2. **Admin Review API** (`/api/admin/review`)
   - **Method**: POST/GET
   - **Purpose**: Submits/retrieves review decisions
   - **Request**: Decision, notes, rejection reason
   - **Response**: Review status and confirmation

## Database Schema

The database schema has been enhanced with new tables for Dojah integration:

### DojahVerification
Stores results from Dojah verification calls.

```prisma
model DojahVerification {
  id                String                @id @default(cuid())
  userId            String
  verificationType  DojahVerificationType
  documentId        String?               // References KYCDocument or SelfieVerification
  referenceId       String?               // Dojah's reference ID
  requestData       Json?                 // Original request payload
  responseData      Json?                 // Dojah response
  status            DojahStatus           @default(PENDING)
  confidence        Float?                // Confidence score from Dojah
  matchResult       Json?                 // Face match or document match results
  extractedData     Json?                 // Extracted data from document analysis
  governmentData    Json?                 // Data from government lookup APIs
  errorMessage      String?
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  user              User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  adminReviews      AdminReview[]
  
  @@index([userId, verificationType])
  @@index([referenceId])
}
```

### DocumentAnalysis
Stores OCR and document analysis results.

```prisma
model DocumentAnalysis {
  id               String    @id @default(cuid())
  kycDocumentId    String    @unique
  extractedText    String?
  extractedData    Json?     // Structured data extracted from document
  documentType     String?   // Detected document type
  confidence       Float?    // Analysis confidence score
  isReadable       Boolean   @default(false)
  qualityScore     Float?    // Document quality score
  analysisProvider String    @default("DOJAH")
  createdAt        DateTime  @default(now())
  kycDocument      KYCDocument @relation(fields: [kycDocumentId], references: [id], onDelete: Cascade)
}
```

### AdminReview
Tracks admin review decisions.

```prisma
model AdminReview {
  id                String                @id @default(cuid())
  userId            String
  reviewerId        String
  documentId        String?               // KYCDocument or SelfieVerification ID
  verificationType  AdminReviewType
  dojahVerificationId String?
  status            AdminReviewStatus     @default(PENDING)
  reviewNotes       String?
  rejectionReason   String?
  allowReupload     Boolean               @default(false)
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  user              User                  @relation(fields: [userId], references: [id])
  reviewer          User                  @relation("AdminReviews", fields: [reviewerId], references: [id])
  dojahVerification DojahVerification?    @relation(fields: [dojahVerificationId], references: [id])
  
  @@index([userId])
  @@index([reviewerId])
}
```

## UI Components

### Admin Interface Components

#### DojahVerificationDisplay
A comprehensive component for displaying verification results to admins.

**Features:**
- Document preview with data extraction
- Government verification results with match status
- Confidence score visualization
- Detailed data inspection capabilities
- Admin review interface for decisions

**Implementation:**
- Located at `/components/admin/DojahVerificationDisplay.tsx`
- Dynamic details toggle for showing/hiding sensitive data
- Color-coded status indicators
- Decision form with notes and rejection reason

#### Enhanced User Details Page
A tabbed interface for complete user verification overview.

**Features:**
- Overview tab with personal information and status summary
- Documents tab with detailed verification information
- History tab showing all admin review actions
- Dojah verification summary with statistics

**Implementation:**
- Located at `/app/admin/(admin)/users/[id]/page.tsx`
- Reactive UI that updates on admin actions
- Document download functionality
- Mobile-responsive design

### User Interface Components

#### NigeriaValidationResults
User-facing component showing validation status.

**Features:**
- Verification status tracking for government lookups
- Data privacy controls (show/hide sensitive information)
- Visual confidence score indicators
- Detailed verification data with masking

**Implementation:**
- Located at `/components/user/NigeriaValidationResults.tsx`
- Data masking for sensitive information
- Real-time status updates
- Refresh capability

## Security & Compliance

### Data Protection

#### Sensitive Data Handling
- Personal identifiers (BVN, NIN) are masked in UI
- Full data visible only to authorized admins
- Data encryption in database
- Secure API calls with authentication

#### Access Controls
- Role-based permissions (USER vs ADMIN)
- Session validation for all sensitive operations
- IP tracking and suspicious login detection
- Audit logging for all data access

### Regulatory Compliance

#### KYC Requirements
- Document verification meets Nigeria financial regulations
- Multiple identification methods supported
- AML screening functionality
- Verification status tracking for audits

#### Audit Trail
- Complete record of all verification attempts
- Admin actions logged with timestamps
- Review decisions documented with reasoning
- Exportable logs for regulatory reporting

## Error Handling

### User-Facing Errors

#### Document Upload Errors
- File size limitations clearly communicated
- Format validation with friendly error messages
- Upload progress tracking with retry functionality
- Network failure handling with graceful recovery

#### Verification Errors
- Clear communication of verification failures
- Specific instructions for rejected documents
- Privacy-preserving error messages
- Guided path for resolution

### System Errors

#### API Failures
- Automatic retry for transient failures
- Fallback to manual verification
- Error logging with request/response details
- Alert system for critical failures

#### Data Integrity Errors
- Validation checks on all incoming data
- Consistency enforcement in database operations
- Recovery procedures for incomplete verifications
- Monitoring for unusual verification patterns

## Configuration Guide

### Environment Setup

1. **Basic Configuration**

   Create or update `.env.local` with Dojah API credentials:

   ```bash
   # Dojah API Configuration
   DOJAH_APP_ID=your_dojah_app_id_here
   DOJAH_SECRET_KEY=your_dojah_secret_key_here
   DOJAH_BASE_URL=https://api.dojah.io
   DOJAH_ENVIRONMENT=sandbox  # or 'production'
   
   # Test Credentials (for sandbox)
   DOJAH_TEST_BVN=22222222222
   DOJAH_TEST_NIN=70123456789
   DOJAH_TEST_PASSPORT=A00123456
   DOJAH_TEST_DRIVERS_LICENSE=FKJ494A2133
   ```

2. **Database Setup**

   Apply the required database migrations:

   ```bash
   npx prisma migrate dev --name add_dojah_integration
   ```

   This creates all necessary tables including:
   - `DojahVerification`
   - `DocumentAnalysis`
   - `AdminReview`

3. **API Configuration**

   The integration will automatically use environment variables. No additional configuration is required for the API endpoints.

### Testing the Integration

1. **Sandbox Testing**
   - Set `DOJAH_ENVIRONMENT=sandbox` in `.env.local`
   - Use test credentials provided by Dojah
   - All API calls will use sandbox endpoints

2. **Production Deployment**
   - Set `DOJAH_ENVIRONMENT=production`
   - Update credentials with production API keys
   - Remove or disable test credentials

## Troubleshooting

### Common Issues

#### Document Verification Failures

**Symptoms:**
- Document analysis returns low confidence scores
- Government lookups fail with no match
- Extracted data is incomplete or inaccurate

**Solutions:**
1. Check document image quality (resolution, lighting)
2. Verify document type is correctly specified
3. Ensure document is not expired
4. Try resubmitting with clearer images

#### API Connection Issues

**Symptoms:**
- Timeouts during verification
- Error responses from Dojah API
- Incomplete verification results

**Solutions:**
1. Verify API credentials are correct
2. Check API rate limits
3. Ensure network connectivity to Dojah servers
4. Review server logs for detailed error messages

#### Database Issues

**Symptoms:**
- Verification results not being stored
- Missing relationships between entities
- Inconsistent verification status

**Solutions:**
1. Verify database migrations are applied correctly
2. Check database connection parameters
3. Ensure all required fields are populated
4. Run database consistency checks

## Future Enhancements

### Planned Features

#### Enhanced Biometric Verification
- Fingerprint integration
- Voice recognition
- Enhanced liveness detection
- 3D face mapping

#### Expanded Document Support
- Vehicle registration
- Property documentation
- Business licenses
- Tax identification

#### Improved Analytics
- Fraud detection algorithms
- Verification success predictors
- Processing time optimization
- User experience analytics

### Integration Roadmap

#### Q3 2025
- Mobile SDK integration for document capture
- Enhanced document analysis with AI classification
- Improved error handling and recovery

#### Q4 2025
- Multi-country expansion beyond Nigeria
- Blockchain verification record option
- Real-time verification status webhooks

#### Q1 2026
- Machine learning fraud detection
- Enhanced AML screening
- Biometric verification enhancements

## Reference Implementation

For a reference implementation of the Dojah integration, see the following core files:

1. **Dojah Service**: `/lib/dojah-service.ts`
2. **Document Analysis API**: `/app/api/user/document-analysis/route.ts`
3. **Verification API**: `/app/api/user/dojah-verification/route.ts`
4. **Admin Review API**: `/app/api/admin/review/route.ts`
5. **Admin UI Component**: `/components/admin/DojahVerificationDisplay.tsx`
6. **User UI Component**: `/components/user/NigeriaValidationResults.tsx`

---

For additional support or questions about the Dojah integration, contact the development team or refer to the official Dojah documentation at [https://api-docs.dojah.io](https://api-docs.dojah.io).