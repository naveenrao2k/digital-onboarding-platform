# Credit Bureau Check System

This document provides information on using the Credit Bureau Check feature in the admin dashboard.

## Overview

The Credit Bureau Check system allows administrators to check users' credit history by BVN number using the Dojah API. This helps identify potential fraud risks and assess credit worthiness.

## Features

- Credit bureau lookups by BVN
- Risk score calculation based on credit data
- Detailed view of credit history, loans, and enquiries
- History of previous credit checks

## Configuration

### Environment Variables

The credit bureau check system uses the following environment variables:

```
# Dojah API Configuration
DOJAH_APP_ID="your_app_id"          # Used in the 'AppId' header
DOJAH_SECRET_KEY="your_secret_key"   # Used directly in the 'Authorization' header (no Bearer prefix)
DOJAH_PUBLIC_KEY="your_public_key"   # Used for client-side integrations if needed

# Environment settings
DOJAH_ENVIRONMENT="production"  # Or "sandbox"
DOJAH_BASE_URL="https://api.dojah.io"  # Base URL for the current environment
```

## Handling Common Scenarios

### 1. Normal Successful Response
When credit data is found for a BVN, the system will display:
- Personal information
- Credit summary
- Loan history
- Credit enquiries
- Risk score

### 2. No Credit History Found (404 Error)
When a valid BVN has no credit history in the bureau:
- A user-friendly error message will be displayed

### 3. Dojah API Unavailable (424 Error)
When the Dojah API cannot connect to the credit bureau:
- An error message will be displayed
- The user should try again later

### 4. Network Connection Failures
When there are network errors connecting to the Dojah API:
- A network error message will be displayed
- A timeout of 8 seconds is applied on the server-side and 15 seconds on the client-side

### 5. Authentication Errors
If you encounter authentication errors:
- Verify that your Dojah API credentials (App ID and Secret Key) are correct
- Ensure that `Authorization` header contains your Secret Key (directly, without any prefix)
- Ensure that your Dojah account has access to the Credit Bureau API

## Diagnostic Tool

The project includes a diagnostic script to validate Dojah API connectivity:

```
node scripts/test-dojah-credentials.js
```

This will:
1. Test general connectivity to the Dojah API
2. Specifically test the Credit Bureau endpoint
3. Provide detailed error information and suggestions
- Generates different risk levels based on BVN digits
- Provides all the same data fields as the real API
- Makes local development possible without depending on the API

## Troubleshooting

### Common Issues:

1. **Authentication errors**
   - Verify your API keys are correctly configured
   - Check that you're using the Secret Key for the Authorization header

2. **"Unable to reach service" error**
   - This is a temporary issue with Dojah's connection to the credit bureau
   - Try again later

3. **"No credit data available" error**
   - This is normal for BVNs with no credit history
   - Try a different BVN

4. **Empty or incomplete data**
   - Some BVNs may return partial credit information
   - Ensure risk scoring handles missing fields gracefully

### Support

For continued issues with the Dojah API:
- Contact Dojah support at support@dojah.io
- Provide them with the specific error messages from the logs
