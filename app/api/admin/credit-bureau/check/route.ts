import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

// Dojah API configuration - Use the DOJAH_SECRET_KEY for server-side endpoints!
const DOJAH_SECRET_KEY = process.env.DOJAH_SECRET_KEY; // Secret key required for server-side API access
const DOJAH_PUBLIC_KEY = process.env.DOJAH_PUBLIC_KEY; // Also load public key to try as fallback
const DOJAH_APP_ID = process.env.DOJAH_APP_ID;
const DOJAH_ENVIRONMENT = process.env.DOJAH_ENVIRONMENT || 'production';

// Select the correct base URL based on environment
const DOJAH_BASE_URL = DOJAH_ENVIRONMENT === 'sandbox'
  ? process.env.DOJAH_BASE_URL_SANDBOX || 'https://sandbox.dojah.io'
  : process.env.DOJAH_BASE_URL_PRODUCTION || 'https://api.dojah.io';

// Maximum number of retry attempts for API calls
const MAX_RETRY_ATTEMPTS = 2;
// Timeout increased to 15 seconds (15000ms)
const API_TIMEOUT = 15000;

/**
 * Helper function to make API calls with retries
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRY_ATTEMPTS) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error;
      console.log(`API call attempt ${attempt + 1}/${retries + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');

      // If we've used all retries, or if it's not a network error, throw
      if (attempt >= retries || !(error instanceof Error && error.name === 'AbortError')) {
        break;
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s, etc.)
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`Waiting ${backoffDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError;
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin permissions
    const adminSession = await getAdminSession();
    const adminUser = adminSession?.user;

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get BVN from query parameters
    const url = new URL(req.url);
    const bvn = url.searchParams.get('bvn');

    if (!bvn || bvn.length !== 11) {
      return new NextResponse(JSON.stringify({ error: 'Valid BVN is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Dojah Credit Bureau API with retry mechanism
    let response;
    try {
      console.log('Calling Dojah API with:', {
        url: `${DOJAH_BASE_URL}/api/v1/credit_bureau?bvn=${bvn}`,
        appIdProvided: !!DOJAH_APP_ID,
        secretKeyProvided: !!DOJAH_SECRET_KEY,
        publicKeyProvided: !!DOJAH_PUBLIC_KEY,
        secretKeyPrefix: DOJAH_SECRET_KEY ? DOJAH_SECRET_KEY.substring(0, 10) + '...' : 'MISSING',
        publicKeyPrefix: DOJAH_PUBLIC_KEY ? DOJAH_PUBLIC_KEY.substring(0, 10) + '...' : 'MISSING'
      });

      // Try with Secret Key first - this is recommended for server-side calls
      response = await fetchWithRetry(`${DOJAH_BASE_URL}/api/v1/credit_bureau?bvn=${bvn}`, {
        method: 'GET',
        headers: {
          'Authorization': DOJAH_SECRET_KEY || '', // No prefix for Dojah API
          'AppId': DOJAH_APP_ID || '',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Dojah API connection error:', error);

      // Return an error to the client
      return new NextResponse(JSON.stringify({
        error: 'Failed to connect to credit bureau API',
        details: {
          message: error instanceof Error ? error.message : 'Network error',
          code: error instanceof Error ? (error as any).code : undefined
        },
        suggestion: 'The credit bureau service is currently unavailable. Please try again later.'
      }), {
        status: 503, // Service Unavailable
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      // Log detailed information for troubleshooting
      console.error('Dojah API request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: `${DOJAH_BASE_URL}/api/v1/credit_bureau?bvn=${bvn}`,
        appIdProvided: !!DOJAH_APP_ID,
        secretKeyProvided: !!DOJAH_SECRET_KEY,
        secretKeyPrefix: DOJAH_SECRET_KEY ? DOJAH_SECRET_KEY.substring(0, 10) + '...' : 'MISSING',
        environment: DOJAH_ENVIRONMENT, headers: {
          authorization: `${DOJAH_SECRET_KEY ? DOJAH_SECRET_KEY.substring(0, 10) + '...' : 'MISSING'}`,
          appId: DOJAH_APP_ID || 'MISSING'
        }
      });

      let errorData;
      try {
        errorData = await response.json();
        console.error('Dojah API error response:', errorData);
      } catch (e) {
        const textResponse = await response.text();
        console.error('Dojah API non-JSON error response:', textResponse.substring(0, 500));
        errorData = { message: 'Invalid response from Dojah API' };
      }

      // Handle specific error cases
      let errorMessage = 'Failed to fetch credit bureau data';
      let userSuggestion = '';
      // Handle "Unable to reach service" error (common with credit bureau)
      if (errorData?.error === 'Unable to reach service') {
        errorMessage = 'Credit bureau service is currently unavailable';
        userSuggestion = 'This is typically a temporary issue with Dojah\'s connection to the credit bureau. Please try again later.';

        // Log detailed error for monitoring
        console.error('Dojah Credit Bureau service unavailable', {
          timestamp: new Date().toISOString(),
          bvn: bvn.substring(0, 3) + '****' + bvn.substring(bvn.length - 3), // Mask the BVN for logging
          environment: DOJAH_ENVIRONMENT
        });
      }
      // Handle "No credit data available" error (common for valid BVNs that don't have credit history)
      if (response.status === 404 && errorData?.error === 'No credit data available for this borrower') {
        errorMessage = 'No credit data found';
        userSuggestion = 'This BVN does not have any credit history in the bureau database. This may be normal for individuals who have not taken loans before.';

        console.log('No credit data found for BVN', {
          bvn: bvn.substring(0, 3) + '****' + bvn.substring(bvn.length - 3), // Mask the BVN for logging
        });
      }
      if (response.status === 424) {
        // 424 Failed Dependency typically means an upstream service is down
        errorMessage = 'Credit bureau upstream service unavailable';
        userSuggestion = 'The credit bureau service is temporarily unavailable. Please try again later.';
      }

      return new NextResponse(JSON.stringify({
        error: errorMessage,
        details: errorData,
        suggestion: userSuggestion
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get data from Dojah
    const creditData = await response.json();
    // Log the API check
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'CREDIT_CHECK',
        details: JSON.stringify({
          bvn: bvn,
          success: true
        })
      }
    });

    return new NextResponse(JSON.stringify(creditData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Credit Bureau check error:', error);
    // Log extra troubleshooting information
    if (!DOJAH_APP_ID || !DOJAH_SECRET_KEY) {
      console.error('Missing Dojah credentials:', {
        appIdExists: !!DOJAH_APP_ID,
        secretKeyExists: !!DOJAH_SECRET_KEY,
        publicKeyExists: !!DOJAH_PUBLIC_KEY
      });
    }

    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new NextResponse(JSON.stringify({
      error: errorMessage,
      suggestion: 'Please check Dojah API credentials in environment variables'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
