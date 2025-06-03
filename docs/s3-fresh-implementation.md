# S3 Storage Implementation - Fresh Start

This document outlines the S3 storage implementation for the Digital Onboarding Platform. Instead of migrating existing data, we've adopted a fresh start approach for a cleaner implementation.

## Overview

We've completely removed the legacy base64 storage and file chunking approach in favor of AWS S3 for storing all document and selfie images. This provides:

1. Better performance for file uploads and downloads
2. Reduced database size and complexity
3. Improved scalability for large file handling
4. More secure and standardized file storage

## Implementation Details

### Storage Models

All file storage now uses AWS S3 with the following fields:

- `fileUrl`: The complete S3 URL for direct access to the file
- `s3Key`: The S3 object key for internal operations
- File metadata: `fileName`, `fileSize`, `mimeType`

### Key Components

1. **S3 Service (`s3-service.ts`)**
   - Core utility functions for S3 operations
   - Methods for uploading, downloading, and generating presigned URLs
   - Handles file naming conventions and key generation

2. **Updated Storage Models**
   - `KYCDocument`: Now stores S3 references instead of base64 or chunked content
   - `SelfieVerification`: Now stores S3 references instead of base64 or chunked content
   - `FileChunk`: Completely removed from the database schema

3. **Service Integrations**
   - `kyc-service.ts`: Updated to store uploaded documents in S3
   - `dojah-service.ts`: Updated to process files from S3
   - `file-upload-service.ts`: Client-side upload logic updated for S3

## Fresh Start Migration

Instead of migrating existing data, we've chosen a fresh start approach:

1. Schema changes were made to remove legacy fields and make S3 fields required
2. The `FileChunk` table was removed completely
3. All new uploads go directly to S3
4. No migration of existing data is needed

## Environment Configuration

Required environment variables:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_BUCKET_NAME=digital-onboarding-platform
```

## S3 Bucket Setup

1. Create an S3 bucket with the name specified in your environment variable
2. Configure appropriate CORS settings:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-domain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
3. Set up appropriate IAM permissions for your AWS credentials

## Security Considerations

1. Files are accessed via signed URLs to prevent unauthorized access
2. URLs are time-limited for security
3. Sensitive documents are stored with appropriate access controls

## Performance Improvements

1. Direct download links for faster client access
2. No more base64 encoding/decoding overhead
3. Reduced database load and size
