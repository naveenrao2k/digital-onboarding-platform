# Digital Onboarding Platform - S3 Migration Guide

This guide explains how we've migrated from using base64 storage to AWS S3 for handling images and documents in our digital onboarding platform.

## Migration Overview

### What Changed?

- **Storage Method**: Documents and selfies are now stored in AWS S3 instead of as base64 in the database
- **Database Schema**: Added `fileUrl` and `s3Key` fields to document storage models
- **Reduced Database Size**: Significantly reduced the database size by moving binary data to S3
- **Performance Improvement**: Faster loading times for documents and selfies
- **Scalability**: Better handling of large files

## Implementation Details

### New Environment Variables

Add these to your `.env` file:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_BUCKET_NAME=digital-onboarding-platform
```

### S3 Setup

1. Create an S3 bucket in your AWS account
2. Configure CORS settings to allow access from your application domain
3. Set up IAM user with appropriate permissions (S3 read/write)

## Migration Process

The migration process consists of two steps:

### 1. Migrating Existing Data

Run the migration script to move existing documents and selfies to S3:

```bash
npm run migrate:s3
```

This script:
- Finds all documents and selfies stored as base64 or chunks
- Uploads them to S3
- Updates the database records with S3 URLs and keys
- Preserves the original data until cleanup

### 2. Cleaning Up After Migration

After verifying that the migration was successful, run the cleanup script:

```bash
npm run cleanup:s3
```

**CAUTION:** This will permanently remove the base64 data from the database. Make sure to verify that all files are properly stored in S3 before running this script.

## Technical Implementation

- `s3-service.ts`: Contains S3 utility functions for upload, download, and URL generation
- `kyc-service.ts`: Updated to use S3 for document storage
- `dojah-service.ts`: Updated to handle documents from S3 for verification

## Rollback Plan

In case of issues:

1. The original base64 data is preserved until the cleanup script is run
2. Revert code changes to restore base64 processing

## Future Improvements

- Implement direct-to-S3 uploads from the client for better performance
- Set up automatic file expiration for temporary documents
- Add image compression before upload for better storage efficiency
