// scripts/test-ip-check.js
require('dotenv').config();

// Import the DojahService class
const fs = require('fs');
const path = require('path');

async function testIpCheck() {
    try {
        console.log('Testing IP address check...');

        // Test variables
        const baseUrl = process.env.DOJAH_BASE_URL || 'https://api.dojah.io';
        const appId = process.env.DOJAH_APP_ID;
        const publicKey = process.env.DOJAH_PUBLIC_KEY;
        const secretKey = process.env.DOJAH_SECRET_KEY;

        console.log(`App ID: ${appId}`);
        console.log(`Public Key (first 8 chars): ${publicKey.substring(0, 8)}...`);
        console.log(`Secret Key (first 8 chars): ${secretKey.substring(0, 8)}...`);

        // Test IP addresses to check
        const testIps = ['102.89.22.58', '8.8.8.8'];

        // Test with PUBLIC_KEY
        console.log('\n--- Testing with PUBLIC_KEY ---');
        for (const ip of testIps) {
            console.log(`\nChecking IP: ${ip}`);
            const url = new URL('/api/v1/fraud/ip', baseUrl);
            url.searchParams.append('ip_address', ip);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'AppId': appId,
                    'Authorization': publicKey,
                    'Content-Type': 'application/json',
                }
            });

            console.log(`Status: ${response.status} (${response.ok ? 'Success' : 'Failed'})`);

            try {
                const data = await response.json();
                console.log('Response:', JSON.stringify(data).substring(0, 200) + '...');
            } catch (e) {
                console.log('Error parsing response:', e.message);
            }
        }

        // Test with SECRET_KEY
        console.log('\n--- Testing with SECRET_KEY ---');
        for (const ip of testIps) {
            console.log(`\nChecking IP: ${ip}`);
            const url = new URL('/api/v1/fraud/ip', baseUrl);
            url.searchParams.append('ip_address', ip);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'AppId': appId,
                    'Authorization': secretKey,
                    'Content-Type': 'application/json',
                }
            });

            console.log(`Status: ${response.status} (${response.ok ? 'Success' : 'Failed'})`);

            try {
                const data = await response.json();
                console.log('Response:', JSON.stringify(data).substring(0, 200) + '...');
            } catch (e) {
                console.log('Error parsing response:', e.message);
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testIpCheck().then(() => console.log('Test completed'));
