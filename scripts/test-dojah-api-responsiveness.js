/**
 * Test script to check Dojah API responsiveness
 * 
 * This script makes a series of API calls to Dojah's credit bureau endpoint
 * and reports response times to help identify performance issues.
 * 
 * Usage: node scripts/test-dojah-api-responsiveness.js
 */

require('dotenv').config();

const DOJAH_APP_ID = process.env.DOJAH_APP_ID;
const DOJAH_SECRET_KEY = process.env.DOJAH_SECRET_KEY;
const DOJAH_BASE_URL = process.env.DOJAH_BASE_URL_PRODUCTION || 'https://api.dojah.io';
const TEST_BVN = '22347618959'; // Replace with a valid test BVN or use from args

// Validate required environment variables
if (!DOJAH_APP_ID || !DOJAH_SECRET_KEY) {
    console.error('Error: Missing Dojah credentials in environment variables');
    console.error('Please make sure DOJAH_APP_ID and DOJAH_SECRET_KEY are set');
    process.exit(1);
}

async function testAPICall(timeoutMs) {
    console.log(`\nTesting API call with ${timeoutMs}ms timeout...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
        const response = await fetch(`${DOJAH_BASE_URL}/api/v1/credit_bureau?bvn=${TEST_BVN}`, {
            method: 'GET',
            headers: {
                'AppId': DOJAH_APP_ID,
                'Authorization': DOJAH_SECRET_KEY,
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        clearTimeout(timeoutId);

        console.log(`✅ Response received in ${duration}ms (status: ${response.status})`);

        if (response.ok) {
            console.log('Response successful');
        } else {
            console.log(`Error response: ${response.status} ${response.statusText}`);
            try {
                const errorData = await response.json();
                console.log('Error details:', JSON.stringify(errorData, null, 2));
            } catch (e) {
                const text = await response.text();
                console.log('Error response text:', text.substring(0, 500));
            }
        }

        return { success: true, duration, status: response.status };
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        clearTimeout(timeoutId);

        console.error(`❌ API call failed after ${duration}ms: ${error.message}`);
        return { success: false, duration, error: error.message };
    }
}

async function runTests() {
    console.log('Testing Dojah API responsiveness...');
    console.log(`Base URL: ${DOJAH_BASE_URL}`);
    console.log(`App ID: ${DOJAH_APP_ID.substring(0, 5)}...`);
    console.log(`Secret Key: ${DOJAH_SECRET_KEY.substring(0, 5)}...`);
    console.log('--------------------------------------------------');

    const results = [];

    // Test with different timeouts
    const timeouts = [5000, 10000, 15000, 20000];
    for (const timeout of timeouts) {
        const result = await testAPICall(timeout);
        results.push({ timeout, ...result });
    }

    // Print summary
    console.log('\n--------------------------------------------------');
    console.log('TEST RESULTS SUMMARY:');
    console.log('--------------------------------------------------');
    for (const result of results) {
        if (result.success) {
            console.log(`✅ ${result.timeout}ms timeout: Response in ${result.duration}ms (Status ${result.status})`);
        } else {
            console.log(`❌ ${result.timeout}ms timeout: Failed after ${result.duration}ms (${result.error})`);
        }
    }

    // Provide recommendation
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
        // Get the fastest timeout that succeeded
        const fastestSuccess = successfulResults.sort((a, b) => a.timeout - b.timeout)[0];
        // Add a safety margin of 5 seconds
        const recommendedTimeout = Math.round(fastestSuccess.duration * 1.5) + 5000;

        console.log('\n✨ RECOMMENDATION:');
        console.log(`Based on these results, set your API_TIMEOUT to at least ${recommendedTimeout}ms`);
    } else {
        console.log('\n⚠️ RECOMMENDATION:');
        console.log('All API calls failed. You may need to check your credentials or network connection.');
    }
}

runTests().catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
});
