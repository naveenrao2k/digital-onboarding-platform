// scripts/test-dojah-auth-modes.js
// This script tests both authentication modes for Dojah API calls
require('dotenv').config();

// Mock console for selective logging
const originalConsoleLog = console.log;
console.log = function (...args) {
    // Filter out some verbose logs
    if (args[0]?.includes && args[0].includes('Auth Key starting with:')) {
        return;
    }
    originalConsoleLog.apply(console, args);
};

// Try to load the DojahService
const { DojahAuthMode } = {
    PUBLIC_KEY: 'PUBLIC_KEY',
    SECRET_KEY: 'SECRET_KEY'
};

// Simple fetch implementation to test auth
async function testFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : await response.text();

        return {
            ok: response.ok,
            status: response.status,
            data,
        };
    } catch (error) {
        console.error(`Fetch error: ${error.message}`);
        return {
            ok: false,
            status: 0,
            error: error.message
        };
    }
}

async function testAuthMode(authMode) {
    const baseUrl = process.env.DOJAH_BASE_URL || 'https://api.dojah.io';
    const appId = process.env.DOJAH_APP_ID;

    // Get the appropriate auth key based on mode
    const authKey = authMode === 'PUBLIC_KEY'
        ? process.env.DOJAH_PUBLIC_KEY
        : process.env.DOJAH_SECRET_KEY;

    console.log(`\n=== Testing ${authMode} authentication ===`);
    console.log(`App ID: ${appId}`);
    console.log(`Auth key (first 8 chars): ${authKey.substring(0, 8)}...`);

    // Test URLs based on auth mode
    const endpoints = {
        PUBLIC_KEY: [
            '/api/v1/fraud/ip?ip_address=102.89.22.58',   // IP fraud check 
            '/api/v1/credit_bureau?bvn=22222222222'       // Credit bureau check
        ],
        SECRET_KEY: [
            '/api/v1/kyc/bvn/full?bvn=22222222222',       // BVN lookup (KYC)
            '/api/v1/kyc/driver_license?license_number=FKJ494A2133'  // Driver's license (KYC)
        ]
    };

    // Run tests for each endpoint appropriate for this auth mode
    for (const endpoint of endpoints[authMode]) {
        console.log(`\nTesting endpoint: ${endpoint}`);

        const url = new URL(endpoint, baseUrl);
        const response = await testFetch(url.toString(), {
            method: 'GET',
            headers: {
                'AppId': appId,
                'Authorization': authKey,
                'Content-Type': 'application/json',
            }
        });

        console.log(`Status: ${response.status} (${response.ok ? 'Success' : 'Failed'})`);

        if (response.ok) {
            console.log(`Response has entity: ${response.data && response.data.entity ? 'Yes' : 'No'}`);
        } else if (response.data) {
            console.log(`Error: ${JSON.stringify(response.data).substring(0, 100)}`);
        }
    }
}

async function testPostWithAuth(authMode) {
    const baseUrl = process.env.DOJAH_BASE_URL || 'https://api.dojah.io';
    const appId = process.env.DOJAH_APP_ID;

    // Get the appropriate auth key based on mode
    const authKey = authMode === 'PUBLIC_KEY'
        ? process.env.DOJAH_PUBLIC_KEY
        : process.env.DOJAH_SECRET_KEY;

    console.log(`\n=== Testing ${authMode} POST authentication ===`);

    // We'll only test document analysis with SECRET_KEY
    if (authMode === 'SECRET_KEY') {
        // Create a small test image (a 1x1 transparent PNG in base64)
        const smallTestImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        const url = new URL('/api/v1/document/analysis', baseUrl);
        console.log(`Testing document analysis endpoint with ${authMode}`);

        const response = await testFetch(url.toString(), {
            method: 'POST',
            headers: {
                'AppId': appId,
                'Authorization': authKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input_type: 'base64',
                imagefrontside: smallTestImage
            })
        });

        console.log(`Status: ${response.status} (${response.ok ? 'Success' : 'Failed'})`);

        if (response.ok) {
            console.log(`Response has entity: ${response.data && response.data.entity ? 'Yes' : 'No'}`);
        } else if (response.data) {
            console.log(`Error: ${JSON.stringify(response.data).substring(0, 100)}`);
        }
    }
}

async function main() {
    console.log('==== Dojah Authentication Mode Test ====');
    console.log(`Environment: ${process.env.DOJAH_ENVIRONMENT || 'not set'}`);
    console.log(`Base URL: ${process.env.DOJAH_BASE_URL || 'not set'}\n`);

    // Test public key authentication
    await testAuthMode('PUBLIC_KEY');

    // Test secret key authentication  
    await testAuthMode('SECRET_KEY');

    // Test POST requests
    await testPostWithAuth('SECRET_KEY');
}

main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
