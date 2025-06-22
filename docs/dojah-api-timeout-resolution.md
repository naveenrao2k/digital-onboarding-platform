# Dojah API Integration Troubleshooting Guide

## Recent Fixes: API Timeout Resolution (June 2025)

### Issue Summary
The system was experiencing `AbortError` failures when calling the Dojah Credit Bureau API. These errors occurred due to the API taking longer than the configured 8-second timeout to respond.

### Solution Implemented
1. **Increased Timeout Duration:** Increased from 8 seconds to 15 seconds to accommodate slower response times from Dojah's Credit Bureau service
2. **Added Retry Mechanism:** Implemented automatic retry logic with exponential backoff
3. **Enhanced Error Handling:** Improved error details to provide clearer information about failures
4. **Diagnostic Script:** Added `test-dojah-api-responsiveness.js` to help diagnose API latency issues

### Key Code Changes
- Added retry mechanism in `app/api/admin/credit-bureau/check/route.ts`
- Improved the `DojahService` class with better timeout and retry handling
- Added constants for timeout and retry configuration

## Troubleshooting Guide

### Common Dojah API Issues

#### 1. API Timeout Errors
If you're still experiencing timeout errors after the fix:

- **Check Network Connectivity:** Ensure your server has stable internet connectivity
- **Run Diagnostic Script:** Execute `node scripts/test-dojah-api-responsiveness.js` to check actual response times
- **Adjust Timeout:** If needed, increase the `API_TIMEOUT` constant in both files:
  - `app/api/admin/credit-bureau/check/route.ts`
  - `lib/dojah-service.ts`

#### 2. Authentication Failures
If you see authentication errors:

- Verify the `DOJAH_APP_ID`, `DOJAH_SECRET_KEY`, and `DOJAH_PUBLIC_KEY` environment variables
- Ensure you're using the correct credentials for your environment (sandbox vs. production)
- Use `node scripts/test-dojah-credentials.js` to validate your credentials

#### 3. "Unable to reach service" Errors
This is a common error with credit bureau services and typically indicates:

- Temporary issues with Dojah's connection to the credit bureau (often resolves automatically)
- The BVN provided may not exist in the credit bureau database
- Dojah's credit bureau service may be experiencing downtime

### Monitoring and Debugging Tips

1. **Check Dojah Status Page:** Refer to Dojah's status page to see if there are any known service issues
2. **Monitor Response Times:** Use the implemented logging to track API response times over time
3. **Contact Dojah Support:** For persistent issues, reach out to Dojah support with the specific error codes and timestamps

## Configuration Reference

### Timeout and Retry Settings

In both service implementations, these constants can be adjusted:

```typescript
// Maximum number of retry attempts for API calls
const MAX_RETRY_ATTEMPTS = 2;
// Timeout in milliseconds (15 seconds)
const API_TIMEOUT = 15000;
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DOJAH_APP_ID | Your Dojah application ID | Yes |
| DOJAH_SECRET_KEY | Your Dojah secret key for server-side calls | Yes |
| DOJAH_PUBLIC_KEY | Your Dojah public key for client-side calls | Yes |
| DOJAH_ENVIRONMENT | 'sandbox' or 'production' | No (defaults to 'production') |
| DOJAH_BASE_URL_PRODUCTION | Custom production API URL | No (defaults to 'https://api.dojah.io') |
| DOJAH_BASE_URL_SANDBOX | Custom sandbox API URL | No (defaults to 'https://sandbox.dojah.io') |

## Testing the Fix

To verify that the timeout and retry logic are working correctly:

1. Run the diagnostic script:
   ```
   node scripts/test-dojah-api-responsiveness.js
   ```

2. Monitor the logs for API calls:
   ```
   # API call attempt 1/3 failed: AbortError: This operation was aborted
   # Waiting 1000ms before retry...
   # API call attempt 2/3 failed: AbortError: This operation was aborted
   # Waiting 2000ms before retry...
   ```

3. Test the actual endpoint with a valid BVN using your API testing tool (Postman, etc.)
