# Dojah API Authentication Guide

## Authentication Requirements

After fixing the 401 Unauthorized issues with Dojah's API, we've discovered that different Dojah endpoints require different authentication methods:

### SECRET_KEY Authentication Required
These endpoints must use the SECRET_KEY:
- Document Analysis (`/api/v1/document/analysis`)
- KYC Verification (BVN, NIN, driver's license, etc.) (`/api/v1/kyc/*`)
- Selfie Verification (`/api/v1/kyc/photoid/verify`)
- Liveness Check (`/api/v1/ml/liveness/`)
- AML Screening (`/api/v1/aml/*`)
- IP Fraud Detection (`/api/v1/fraud/ip`) - **Exception! This is the only fraud endpoint requiring SECRET_KEY**

### PUBLIC_KEY Authentication Required
These endpoints must use the PUBLIC_KEY:
- Email Fraud Detection (`/api/v1/fraud/email`)
- Phone Fraud Detection (`/api/v1/fraud/phone`) 
- Credit Bureau APIs (`/api/v1/credit_bureau`)

## Implementation Details

The DojahService class now automatically selects the correct authentication key based on the endpoint:

1. The `getAuthModeForEndpoint()` method analyzes the endpoint URL and returns the appropriate auth mode
2. Special case handling was added for the IP fraud endpoint that requires SECRET_KEY
3. All methods explicitly specify which auth mode to use for clarity and to override automatic detection if needed

## Common Issues

If you encounter 401 Unauthorized errors:

1. Check that both DOJAH_PUBLIC_KEY and DOJAH_SECRET_KEY are correctly set in .env
2. Verify that the correct auth key is being used for each endpoint
3. Use the test scripts in the `scripts/` folder to test specific endpoints

## Testing Authentication

Run the `test-ip-check.js` script to specifically test IP fraud detection with both authentication methods:

```
node scripts/test-ip-check.js
```

This will help identify whether the IP fraud detection API is working correctly with the SECRET_KEY (which is the correct key for this endpoint).
