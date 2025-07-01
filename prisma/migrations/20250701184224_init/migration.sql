-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'PARTNERSHIP', 'ENTERPRISE', 'LLC');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC', 'CORPORATION');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'UTILITY_BILL', 'CERTIFICATE_OF_REGISTRATION', 'FORM_OF_APPLICATION', 'VALID_ID_OF_PARTNERS', 'PROOF_OF_ADDRESS', 'CERTIFICATE_OF_INCORPORATION', 'MEMORANDUM_ARTICLES', 'BOARD_RESOLUTION', 'DIRECTORS_ID', 'PASSPORT_PHOTOS', 'UTILITY_RECEIPT', 'BUSINESS_OWNER_ID', 'BVN_SLIP', 'NIN_SLIP', 'DRIVERS_LICENSE', 'VOTERS_CARD');

-- CreateEnum
CREATE TYPE "VerificationStatusEnum" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'REQUIRES_REUPLOAD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "DojahVerificationType" AS ENUM ('BVN_LOOKUP', 'NIN_LOOKUP', 'PASSPORT_LOOKUP', 'DRIVERS_LICENSE_LOOKUP', 'DOCUMENT_ANALYSIS', 'SELFIE_PHOTO_ID_MATCH', 'LIVENESS_CHECK', 'AML_SCREENING', 'FRAUD_IP_CHECK', 'FRAUD_EMAIL_CHECK', 'FRAUD_PHONE_CHECK', 'FRAUD_CREDIT_CHECK');

-- CreateEnum
CREATE TYPE "DojahStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'INCOMPLETE_DATA', 'RETRY_REQUIRED');

-- CreateEnum
CREATE TYPE "AdminReviewType" AS ENUM ('DOCUMENT_VERIFICATION', 'SELFIE_VERIFICATION', 'IDENTITY_VERIFICATION', 'FINAL_APPROVAL');

-- CreateEnum
CREATE TYPE "AdminReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_ADDITIONAL_INFO');

-- CreateEnum
CREATE TYPE "FraudCheckType" AS ENUM ('IP_CHECK', 'EMAIL_CHECK', 'PHONE_CHECK', 'CREDIT_CHECK', 'COMBINED_CHECK');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessType" "BusinessType",
    "businessAddress" TEXT,
    "taxNumber" TEXT,
    "scumlNumber" TEXT,
    "occupation" TEXT,
    "sourceOfIncome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "status" "VerificationStatusEnum" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "KYCDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfieVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "status" "VerificationStatusEnum" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "SelfieVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kycStatus" "VerificationStatusEnum" NOT NULL DEFAULT 'PENDING',
    "selfieStatus" "VerificationStatusEnum" NOT NULL DEFAULT 'PENDING',
    "overallStatus" "VerificationStatusEnum" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "VerificationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "relationship" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetId" TEXT,
    "targetType" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DojahVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationType" "DojahVerificationType" NOT NULL,
    "documentId" TEXT,
    "referenceId" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "status" "DojahStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION,
    "matchResult" JSONB,
    "extractedData" JSONB,
    "governmentData" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DojahVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAnalysis" (
    "id" TEXT NOT NULL,
    "kycDocumentId" TEXT NOT NULL,
    "extractedText" TEXT,
    "extractedData" JSONB,
    "documentType" JSONB,
    "confidence" DOUBLE PRECISION,
    "isReadable" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" DOUBLE PRECISION,
    "analysisProvider" TEXT NOT NULL DEFAULT 'DOJAH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationStatus" JSONB,
    "textData" JSONB,
    "documentImages" JSONB,

    CONSTRAINT "DocumentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "documentId" TEXT,
    "verificationType" "AdminReviewType" NOT NULL,
    "dojahVerificationId" TEXT,
    "status" "AdminReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "allowReupload" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudDetection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationType" "FraudCheckType" NOT NULL,
    "ipAddress" TEXT,
    "emailAddress" TEXT,
    "phoneNumber" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "isFraudSuspected" BOOLEAN NOT NULL DEFAULT false,
    "detectionDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "currentScore" INTEGER NOT NULL DEFAULT 300,
    "previousScore" INTEGER,
    "scoreChange" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditScoreHistory" (
    "id" TEXT NOT NULL,
    "creditScoreId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "changeReason" TEXT,
    "factors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditBureauCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bvn" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "creditScore" INTEGER,
    "riskScore" INTEGER,
    "riskLevel" "RiskLevel",
    "responseData" JSONB,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditBureauCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "factorType" TEXT NOT NULL,
    "factorValue" DOUBLE PRECISION NOT NULL,
    "factorWeight" DOUBLE PRECISION NOT NULL,
    "impact" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "accountNumber" TEXT,
    "balance" DOUBLE PRECISION,
    "limit" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "openedDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditEnquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "enquiryType" TEXT NOT NULL,
    "enquiryDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCFormData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "taxNumber" TEXT,
    "scumlNumber" TEXT,
    "bvn" TEXT,
    "ref1Name" TEXT,
    "ref1Address" TEXT,
    "ref1Phone" TEXT,
    "ref2Name" TEXT,
    "ref2Address" TEXT,
    "ref2Phone" TEXT,
    "extractedData" JSONB,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KYCFormData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfieVerification_userId_key" ON "SelfieVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationStatus_userId_key" ON "VerificationStatus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "DojahVerification_userId_verificationType_idx" ON "DojahVerification"("userId", "verificationType");

-- CreateIndex
CREATE INDEX "DojahVerification_referenceId_idx" ON "DojahVerification"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentAnalysis_kycDocumentId_key" ON "DocumentAnalysis"("kycDocumentId");

-- CreateIndex
CREATE INDEX "AdminReview_userId_idx" ON "AdminReview"("userId");

-- CreateIndex
CREATE INDEX "AdminReview_reviewerId_idx" ON "AdminReview"("reviewerId");

-- CreateIndex
CREATE INDEX "FraudDetection_userId_verificationType_idx" ON "FraudDetection"("userId", "verificationType");

-- CreateIndex
CREATE INDEX "FraudDetection_createdAt_idx" ON "FraudDetection"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditScore_userId_key" ON "CreditScore"("userId");

-- CreateIndex
CREATE INDEX "CreditScoreHistory_creditScoreId_createdAt_idx" ON "CreditScoreHistory"("creditScoreId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditBureauCheck_userId_createdAt_idx" ON "CreditBureauCheck"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditBureauCheck_bvn_idx" ON "CreditBureauCheck"("bvn");

-- CreateIndex
CREATE INDEX "CreditFactor_userId_factorType_idx" ON "CreditFactor"("userId", "factorType");

-- CreateIndex
CREATE INDEX "CreditAccount_userId_accountType_idx" ON "CreditAccount"("userId", "accountType");

-- CreateIndex
CREATE INDEX "CreditEnquiry_userId_enquiryDate_idx" ON "CreditEnquiry"("userId", "enquiryDate");

-- CreateIndex
CREATE INDEX "CreditAlert_userId_isRead_idx" ON "CreditAlert"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "KYCFormData_userId_key" ON "KYCFormData"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYCDocument" ADD CONSTRAINT "KYCDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfieVerification" ADD CONSTRAINT "SelfieVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationStatus" ADD CONSTRAINT "VerificationStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DojahVerification" ADD CONSTRAINT "DojahVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAnalysis" ADD CONSTRAINT "DocumentAnalysis_kycDocumentId_fkey" FOREIGN KEY ("kycDocumentId") REFERENCES "KYCDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_dojahVerificationId_fkey" FOREIGN KEY ("dojahVerificationId") REFERENCES "DojahVerification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudDetection" ADD CONSTRAINT "FraudDetection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScore" ADD CONSTRAINT "CreditScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScoreHistory" ADD CONSTRAINT "CreditScoreHistory_creditScoreId_fkey" FOREIGN KEY ("creditScoreId") REFERENCES "CreditScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditBureauCheck" ADD CONSTRAINT "CreditBureauCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditFactor" ADD CONSTRAINT "CreditFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAccount" ADD CONSTRAINT "CreditAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditEnquiry" ADD CONSTRAINT "CreditEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAlert" ADD CONSTRAINT "CreditAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYCFormData" ADD CONSTRAINT "KYCFormData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
