# Digital Onboarding Platform: Complete System Flow

## Overview

This document provides a comprehensive overview of the complete system flow for the Digital Onboarding Platform, including all major components, user journeys, and integration points. The platform enables financial institutions and businesses to digitally onboard customers through a secure, automated process that includes identity verification, document validation, and regulatory compliance checks.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Client Layer   │     │  Service Layer  │     │ External APIs   │
│  - Next.js UI   │────▶│  - Next.js API  │────▶│ - Dojah        │
│  - React        │     │  - Auth Logic   │     │ - Email Service │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐     ┌─────────────────┐
                       │  Data Layer     │     │  Admin Layer    │
                       │  - PostgreSQL   │────▶│  - Review UI    │
                       │  - Prisma ORM   │     │  - Analytics    │
                       └─────────────────┘     └─────────────────┘
```

### Core Components

1. **User Interface**
   - Responsive web interface for end-users
   - Admin dashboard for verification teams
   - Progress tracking and notifications

2. **API Services**
   - Authentication and authorization
   - Document handling and processing
   - Verification workflows
   - Status tracking and updates

3. **External Integrations**
   - Dojah for identity verification
   - Email service for notifications
   - File storage for documents

4. **Database & Storage**
   - User profiles and accounts
   - Document metadata and storage
   - Verification results
   - Audit trails

## End-to-End User Flow

### 1. Account Creation

**Process:**
1. User visits the platform landing page
2. Clicks "Get Started" or "Create Account"
3. Enters email address and creates password
4. Verifies email through confirmation link
5. Creates basic profile (name, phone, etc.)

**Technical Implementation:**
- Form validation in React components
- API endpoint `/api/auth/signup` for account creation
- Email verification through secure tokens
- Session creation and management via cookies

**Status Tracking:**
- Account status set to `CREATED`
- Email verification status tracked
- Profile completion percentage calculated

### 2. Profile Completion

**Process:**
1. User completes personal information
   - Full name, date of birth, address
   - Contact information and preferences
2. Selects account type/tier
   - Individual
   - Partnership
   - Enterprise
   - LLC
3. Reviews and accepts terms of service

**Technical Implementation:**
- Multi-step form with progress tracking
- API endpoint `/api/user/profile` for updates
- Validation rules based on account type
- Terms of service acceptance logged with timestamp

**Status Tracking:**
- Account status updated to `PROFILE_COMPLETED`
- Profile data completeness validated
- Required fields tracked by account type

### 3. Document Upload

**Process:**
1. User is presented with required documents based on account type
2. For each document:
   - Uploads file (image or PDF)
   - Provides additional metadata if needed
   - Reviews document clarity/quality
3. Submits documents for verification

**Technical Implementation:**
- Drag-and-drop file upload component
- File format validation and optimization
- Secure storage with chunking for large files
- API endpoint `/api/user/kyc-document` for uploads

**Status Tracking:**
- Document status set to `UPLOADED`
- Account status updated to `DOCUMENTS_SUBMITTED`
- Upload timestamp and metadata recorded

### 4. Document Verification (Dojah Integration)

**Process:**
1. System processes uploaded documents:
   - Document analysis for text extraction
   - Type verification (passport, ID card, etc.)
   - Quality assessment
2. Identity information extracted
3. Government database validation:
   - BVN lookup
   - NIN validation
   - Passport verification
   - Driver's license check
4. Results stored and status updated

**Technical Implementation:**
- Document processing via Dojah API
- API endpoint `/api/user/document-analysis`
- Government lookups via `/api/user/dojah-verification`
- Results stored in `DocumentAnalysis` and `DojahVerification` tables

**Status Tracking:**
- Document status updated based on results
- Verification confidence scores recorded
- Match status for government records tracked

### 5. Selfie Verification

**Process:**
1. User prompted to take a selfie for identity verification
2. Webcam interface guides proper positioning
3. Photo captured and submitted
4. System performs:
   - Liveness detection
   - Face matching against ID photo
   - Quality assessment

**Technical Implementation:**
- Webcam capture using browser APIs
- Selfie storage and processing via `/api/user/selfie-verification`
- Face matching using Dojah's facial recognition APIs
- Results stored with confidence scores

**Status Tracking:**
- Selfie status tracked (CAPTURED, VERIFIED, REJECTED)
- Face match confidence score recorded
- Overall verification status updated

### 6. Verification Review

**Process:**
1. Automated verification completed
2. Cases requiring manual review flagged
3. Admin reviews verification results:
   - Document authenticity
   - Identity matching
   - Data consistency
4. Admin decision recorded
5. User notified of verification outcome

**Technical Implementation:**
- Admin review interface at `/admin/users/[id]`
- Review decisions via `/api/admin/review`
- Notification system for status updates
- Audit logging of all review actions

**Status Tracking:**
- Admin review status recorded
- Final verification decision tracked
- Rejection reasons documented if applicable
- Reupload permissions managed

### 7. Account Activation

**Process:**
1. All verification steps completed successfully
2. System performs final compliance checks
3. Account activated for full platform access
4. Welcome materials and next steps provided
5. User begins using platform features

**Technical Implementation:**
- Final verification status confirmation
- Account status update to `ACTIVE`
- Welcome email notification
- Access control updates for full feature access

**Status Tracking:**
- Account activation timestamp
- Verification completion status
- Feature access permissions updated

## Admin Workflows

### 1. Submission Review Queue

**Process:**
1. Admin logs into dashboard
2. Views queue of pending submissions
3. Filters by status, type, or priority
4. Selects submission for review

**Technical Implementation:**
- Admin dashboard at `/admin/submissions`
- Queue management with sorting and filtering
- Priority calculation based on age and type
- Review routing system

### 2. Document Verification Review

**Process:**
1. Admin views user profile and documents
2. Reviews automated verification results
3. Examines Dojah verification data:
   - Document analysis results
   - Government lookup matches
   - Confidence scores
4. Makes verification decision

**Technical Implementation:**
- User detail view at `/admin/users/[id]`
- Document viewer with zoom capabilities
- Verification data presentation via `DojahVerificationDisplay`
- Decision interface with reason documentation

### 3. Audit Trail Management

**Process:**
1. System logs all significant actions
2. Admin can view complete audit history
3. Search and filter functionality
4. Export capabilities for compliance reporting

**Technical Implementation:**
- Audit logging system
- Audit trail view at `/admin/audit-logs`
- Search and filter functionality
- CSV/PDF export options

## Key Integration Points

### Dojah Integration

The platform integrates with Dojah for advanced identity verification:

**Integration Components:**
1. **Document Analysis** - OCR and document validation
2. **Government Database Lookups** - BVN, NIN, Passport, Driver's License
3. **Face Matching** - Selfie to ID comparison
4. **AML Screening** - Anti-Money Laundering checks

For detailed information about the Dojah integration, refer to the [Dojah Integration Documentation](./dojah-integration.md).

### Email Notification System

All status changes trigger appropriate user notifications:

**Key Notifications:**
1. Account creation and verification
2. Document upload confirmation
3. Verification status updates
4. Review decisions and next steps
5. Account activation and welcome

### File Storage System

Secure document storage system for user uploads:

**Features:**
1. File chunking for large documents
2. Access controls and encryption
3. Temporary URL generation for admin review
4. Retention policy compliance

## Status Management

The platform uses a comprehensive status tracking system:

### User Account Statuses
- `CREATED` - Account initially created
- `PROFILE_COMPLETED` - Basic profile information provided
- `DOCUMENTS_SUBMITTED` - KYC documents uploaded
- `VERIFIED` - Verification process completed successfully
- `ACTIVE` - Account active and usable
- `REJECTED` - Verification failed
- `SUSPENDED` - Account temporarily suspended

### Document Statuses
- `PENDING` - Document not yet uploaded
- `UPLOADED` - Document uploaded, not yet processed
- `IN_PROGRESS` - Document undergoing verification
- `APPROVED` - Document successfully verified
- `REJECTED` - Document verification failed
- `REQUIRES_REUPLOAD` - New document upload requested

### Verification Statuses
- `PENDING` - Verification not yet initiated
- `IN_PROGRESS` - Verification underway
- `APPROVED` - Verification successful
- `REJECTED` - Verification failed
- `REQUIRES_ADDITIONAL_INFO` - More information needed

## Error Handling

The platform implements comprehensive error handling:

### User-Facing Errors
- Clear error messages with troubleshooting guidance
- Upload retry mechanisms for network failures
- Document quality feedback and improvement suggestions
- Contact support options for persistent issues

### System Error Management
- API error logging and monitoring
- Fallback mechanisms for external service failures
- Alert system for critical errors
- Recovery procedures for interrupted processes

## Security Measures

The platform includes robust security features:

### Data Protection
- Encryption for sensitive user data
- Secure document storage
- Privacy controls for sensitive information
- Data retention policies

### Access Control
- Role-based permissions system
- Session management and timeout controls
- Admin action logging
- IP tracking and anomaly detection

### Compliance Features
- KYC/AML compliance workflow
- Audit trails for regulatory reporting
- Data export capabilities
- Document verification evidence storage

## Performance Considerations

For optimal system performance:

### Scaling Considerations
- Queue management for high-volume processing
- Optimization for document storage and retrieval
- Caching strategies for frequent data access
- Background processing for verification workflows

### Monitoring
- Performance metrics tracking
- API response time monitoring
- Error rate tracking
- User journey completion analytics

## Reference Implementation

For implementation details, refer to the following key files:

1. **User Interface**:
   - `/app/user/upload-kyc-documents/page.tsx`
   - `/app/user/verification-status/page.tsx`
   - `/app/admin/(admin)/users/[id]/page.tsx`

2. **API Endpoints**:
   - `/app/api/user/kyc-document/route.ts`
   - `/app/api/user/dojah-verification/route.ts`
   - `/app/api/admin/review/route.ts`

3. **Service Layer**:
   - `/lib/kyc-service.ts`
   - `/lib/dojah-service.ts`
   - `/lib/file-upload-service.ts`

4. **Components**:
   - `/components/admin/DojahVerificationDisplay.tsx`
   - `/components/user/NigeriaValidationResults.tsx`

For additional documentation on specific components:
- [Dojah Integration](./dojah-integration.md)
- [KYC Upload Flow](./kyc-upload-flow.md)
- [API Documentation](./api-documentation.md)