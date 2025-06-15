// scripts/test-dojah-api-speed.js
// 
// This script tests Dojah API response times and fallback mechanisms 
// to help diagnose and optimize the fraud detection services
//
// Usage:
//   node scripts/test-dojah-api-speed.js

const fetch = require('node-fetch');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Sample test data
const testData = {
    ipAddress: '8.8.8.8',              // Google DNS IP
    emailAddress: 'test@example.com',  // Example email
    phoneNumber: '+2347000000000',     // Example Nigerian phone
};

// Configuration (can override with env vars)
const DOJAH_APP_ID = process.env.DOJAH_APP_ID || '';
const DOJAH_SECRET_KEY = process.env.DOJAH_SECRET_KEY || '';
const DOJAH_BASE_URL = process.env.DOJAH_BASE_URL || 'https://sandbox.dojah.io';
const TEST_RUNS = process.env.TEST_RUNS ? parseInt(process.env.TEST_RUNS) : 5;
const TIMEOUT_MS = process.env.TIMEOUT_MS ? parseInt(process.env.TIMEOUT_MS) : 15000;

if (!DOJAH_APP_ID || !DOJAH_SECRET_KEY) {
    console.error('Error: Missing Dojah API credentials. Please set DOJAH_APP_ID and DOJAH_SECRET_KEY environment variables.');
    process.exit(1);
}

/**
 * Make a request with timeout
 */
async function makeRequestWithTimeout(endpoint, params = {}, timeout = TIMEOUT_MS) {
    // Build URL with parameters
    const url = new URL(endpoint, DOJAH_BASE_URL);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key].toString());
        }
    });

    console.log(`Making request to: ${url.toString()}`);

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const startTime = Date.now();
        const response = await fetch(url.toString(), {
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

        // Clear timeout since request completed
        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        // Return with timing information
        return {
            success: response.ok,
            duration,
            status: response.status,
            data,
        };
    } catch (error) {
        if (error.name === 'AbortError') {
            return {
                success: false,
                duration: timeout,
                error: 'Request timed out',
            };
        }

        return {
            success: false,
            duration: -1, // Unknown duration
            error: error.message,
        };
    }
}

/**
 * Test IP address verification
 */
async function testIpCheck(ipAddress, timeoutMs) {
    return await makeRequestWithTimeout(
        '/api/v1/fraud/ip',
        { ip_address: ipAddress },
        timeoutMs
    );
}

/**
 * Test email verification
 */
async function testEmailCheck(email, timeoutMs) {
    return await makeRequestWithTimeout(
        '/api/v1/fraud/email',
        { email },
        timeoutMs
    );
}

/**
 * Test phone verification
 */
async function testPhoneCheck(phone, timeoutMs) {
    return await makeRequestWithTimeout(
        '/api/v1/fraud/phone',
        { phone_number: phone },
        timeoutMs
    );
}

/**
 * Run the tests multiple times and calculate averages
 */
async function runTests() {
    console.log(`\n=== Dojah API Performance Test ===`);
    console.log(`Base URL: ${DOJAH_BASE_URL}`);
    console.log(`Timeout: ${TIMEOUT_MS}ms`);
    console.log(`Test runs: ${TEST_RUNS}\n`);

    const results = {
        ip: { times: [], successes: 0, failures: 0 },
        email: { times: [], successes: 0, failures: 0 },
        phone: { times: [], successes: 0, failures: 0 },
    };

    // Run tests in sequence
    for (let i = 0; i < TEST_RUNS; i++) {
        console.log(`\nTest Run #${i + 1}:`);

        // Test IP Check
        console.log(`\nTesting IP check (${testData.ipAddress})...`);
        const ipResult = await testIpCheck(testData.ipAddress, TIMEOUT_MS);
        if (ipResult.success) {
            results.ip.successes++;
            results.ip.times.push(ipResult.duration);
            console.log(`✅ Success (${ipResult.duration}ms)`);
        } else {
            results.ip.failures++;
            console.log(`❌ Failed: ${ipResult.error} (${ipResult.duration}ms)`);
        }

        // Brief pause between requests
        await sleep(500);

        // Test Email Check
        console.log(`\nTesting Email check (${testData.emailAddress})...`);
        const emailResult = await testEmailCheck(testData.emailAddress, TIMEOUT_MS);
        if (emailResult.success) {
            results.email.successes++;
            results.email.times.push(emailResult.duration);
            console.log(`✅ Success (${emailResult.duration}ms)`);
        } else {
            results.email.failures++;
            console.log(`❌ Failed: ${emailResult.error} (${emailResult.duration}ms)`);
        }

        // Brief pause between requests
        await sleep(500);

        // Test Phone Check
        console.log(`\nTesting Phone check (${testData.phoneNumber})...`);
        const phoneResult = await testPhoneCheck(testData.phoneNumber, TIMEOUT_MS);
        if (phoneResult.success) {
            results.phone.successes++;
            results.phone.times.push(phoneResult.duration);
            console.log(`✅ Success (${phoneResult.duration}ms)`);
        } else {
            results.phone.failures++;
            console.log(`❌ Failed: ${phoneResult.error} (${phoneResult.duration}ms)`);
        }

        // Longer pause between test runs
        if (i < TEST_RUNS - 1) {
            console.log('\nPausing before next test run...');
            await sleep(2000);
        }
    }

    // Calculate averages
    function calculateStats(times) {
        if (times.length === 0) return { avg: 'N/A', min: 'N/A', max: 'N/A' };

        const avg = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
        const min = Math.min(...times);
        const max = Math.max(...times);

        return { avg, min, max };
    }

    const ipStats = calculateStats(results.ip.times);
    const emailStats = calculateStats(results.email.times);
    const phoneStats = calculateStats(results.phone.times);

    // Print summary
    console.log('\n\n=== TEST RESULTS SUMMARY ===');
    console.log('\nIP Check:');
    console.log(`  Success rate: ${results.ip.successes}/${TEST_RUNS} (${Math.round(results.ip.successes / TEST_RUNS * 100)}%)`);
    console.log(`  Average time: ${ipStats.avg}ms (Min: ${ipStats.min}ms, Max: ${ipStats.max}ms)`);

    console.log('\nEmail Check:');
    console.log(`  Success rate: ${results.email.successes}/${TEST_RUNS} (${Math.round(results.email.successes / TEST_RUNS * 100)}%)`);
    console.log(`  Average time: ${emailStats.avg}ms (Min: ${emailStats.min}ms, Max: ${emailStats.max}ms)`);

    console.log('\nPhone Check:');
    console.log(`  Success rate: ${results.phone.successes}/${TEST_RUNS} (${Math.round(results.phone.successes / TEST_RUNS * 100)}%)`);
    console.log(`  Average time: ${phoneStats.avg}ms (Min: ${phoneStats.min}ms, Max: ${phoneStats.max}ms)`);

    console.log('\nRecommendations:');

    // Recommended timeout
    const maxAvg = Math.max(
        ipStats.avg !== 'N/A' ? ipStats.avg : 0,
        emailStats.avg !== 'N/A' ? emailStats.avg : 0,
        phoneStats.avg !== 'N/A' ? phoneStats.avg : 0
    );

    if (maxAvg !== 0) {
        const recommendedTimeout = Math.min(60000, Math.round(maxAvg * 2));
        console.log(`  - Recommended API timeout: ${recommendedTimeout}ms (double the highest average)`);
    }

    // Check for any failures
    if (results.ip.failures > 0 || results.email.failures > 0 || results.phone.failures > 0) {
        console.log('  - API reliability issues detected. Ensure your fallback logic is robust.');
    }

    // Warning for serverless environments
    if (maxAvg > 5000) {
        console.log('  - ⚠️ API response times may be too slow for serverless environments.');
        console.log('    Consider implementing non-blocking background check patterns.');
    } else if (maxAvg !== 0) {
        console.log('  - API response times appear suitable for serverless environments.');
    }
}

// Run the tests
runTests()
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
