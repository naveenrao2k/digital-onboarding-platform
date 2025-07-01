// Script to test Dojah API credentials
// Usage: node scripts/test-dojah-credentials.js

require('dotenv').config({ path: '.env.local' });

// Load Dojah credentials from environment variables
const DOJAH_APP_ID = process.env.DOJAH_APP_ID;
const DOJAH_SECRET_KEY = process.env.DOJAH_SECRET_KEY; // Use secret key for Authorization header
const DOJAH_PUBLIC_KEY = process.env.DOJAH_PUBLIC_KEY; // Keep public key for reference
const DOJAH_ENVIRONMENT = process.env.DOJAH_ENVIRONMENT || 'production';

// Select the correct base URL based on environment
const DOJAH_BASE_URL = process.env.DOJAH_BASE_URL || (
  DOJAH_ENVIRONMENT === 'sandbox' 
    ? process.env.DOJAH_BASE_URL_SANDBOX || 'https://sandbox.dojah.io'
    : process.env.DOJAH_BASE_URL_PRODUCTION || 'https://api.dojah.io'
);

// Use test BVN based on environment
const TEST_BVN = process.env.DOJAH_TEST_BVN || '22222222222'; // Default test BVN for sandbox

// Check if required environment variables exist
if (!DOJAH_APP_ID || !DOJAH_SECRET_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Please ensure the following are set in your .env.local file:');
  console.error('- DOJAH_APP_ID');
  console.error('- DOJAH_SECRET_KEY (required for API authorization)');
  console.error('- DOJAH_BASE_URL (optional, defaults to https://api.dojah.io)');
  process.exit(1);
}

// Log configuration
console.log('Dojah API Configuration:');
console.log('- Environment:', DOJAH_ENVIRONMENT);
console.log('- Base URL:', DOJAH_BASE_URL);
console.log('- App ID exists:', !!DOJAH_APP_ID);
console.log('- Public Key exists:', !!DOJAH_PUBLIC_KEY);
console.log('- Secret Key exists:', !!DOJAH_SECRET_KEY);
console.log('- Using test BVN:', TEST_BVN);
console.log('\nAttempting to make a test API call...\n');

// Function to test BVN lookup (general API connectivity test)
async function testBvnLookup() {  try {    const url = `${DOJAH_BASE_URL}/api/v1/kyc/bvn?bvn=${TEST_BVN}`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': DOJAH_SECRET_KEY, // Use SECRET KEY for Authorization
        'AppId': DOJAH_APP_ID,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: API call successful!');
      console.log('\nResponse data (entity field only):');
      console.log(JSON.stringify(data.entity || {}, null, 2));
    } else {
      console.error('❌ ERROR: API call failed with error:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to make API call:', error.message);
  }
}

// Function to test Credit Bureau API (specific to our use case)
async function testCreditBureauApi() {
  try {    const url = `${DOJAH_BASE_URL}/api/v1/credit_bureau?bvn=${TEST_BVN}`;    console.log('\nTesting Credit Bureau API:');
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': DOJAH_SECRET_KEY, // Use SECRET KEY for Authorization
        'AppId': DOJAH_APP_ID,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error('Invalid JSON response');
    }
      if (response.ok) {
      console.log('✅ SUCCESS: Credit Bureau API call successful!');
      console.log('\nResponse data (entity field only):');
      console.log(JSON.stringify(data.entity || data, null, 2));
    } else {
      console.error('❌ ERROR: Credit Bureau API call failed with error:');
      console.error(JSON.stringify(data, null, 2));
        // Special handling for common Credit Bureau errors
      if (data.error === 'Unable to reach service' || response.status === 424) {
        console.log('\n⚠️ SPECIAL NOTE: "Unable to reach service" error detected');
        console.log('This is a common issue when Dojah cannot connect to the credit bureau service.');
        console.log('Possible reasons:');
        console.log('1. The credit bureau service is temporarily down');
        console.log('2. Your Dojah account may not have credit bureau services enabled');
        console.log('3. The BVN you\'re using may not be valid for credit bureau checks');
        console.log('\nSuggested actions:');
        console.log('- Try again later');
        console.log('- Contact Dojah support to confirm your account has credit bureau access');
        console.log('- Try with a different BVN');
        console.log('- Try again later if this persists');
      } 
      
      // Handle no credit data available case
      if (response.status === 404 && data.error === 'No credit data available for this borrower') {
        console.log('\n⚠️ SPECIAL NOTE: "No credit data available" error detected');
        console.log('This is a normal response when the person has no credit history.');
        console.log('Possible reasons:');
        console.log('1. The individual has never taken a formal loan from a reporting institution');
        console.log('2. The BVN may be new or not linked to any credit accounts');
        console.log('3. The credit bureaus may not have data for this individual');
        console.log('\nSuggested actions:');
        console.log('- This is not an error, but expected for some users');
        console.log('- Try with a different BVN that has credit history');
        console.log('- This is normal for BVNs with no credit history');
      }
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to make Credit Bureau API call:', error.message);
  }
}

// Run the tests in sequence
async function runTests() {
  console.log('TEST 1: Basic BVN Lookup');
  await testBvnLookup();
  
  console.log('\n-----------------------------------\n');
  
  console.log('TEST 2: Credit Bureau API');
  await testCreditBureauApi();
}

runTests();

async function testDojahCredentials() {
  console.log('🔍 Testing Dojah API Credentials...\n');
  
  // Check if environment variables are set
  const requiredVars = ['DOJAH_APP_ID', 'DOJAH_SECRET_KEY', 'DOJAH_BASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📝 Please add these to your .env.local file');
    return;
  }
  
  console.log('✅ Environment variables found:');
  console.log(`   - DOJAH_APP_ID: ${process.env.DOJAH_APP_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`   - DOJAH_SECRET_KEY: ${process.env.DOJAH_SECRET_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`   - DOJAH_BASE_URL: ${process.env.DOJAH_BASE_URL}`);
  
  // Test API call with a sample BVN
  const testBvn = '12345678901'; // This is a test BVN
  
  try {
    console.log('\n🔄 Testing API call...');
    
    const response = await fetch(`${process.env.DOJAH_BASE_URL}/api/v1/credit_bureau?bvn=${testBvn}`, {
      method: 'GET',
      headers: {
        'Authorization': process.env.DOJAH_SECRET_KEY,
        'AppId': process.env.DOJAH_APP_ID,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API call successful!');
      console.log('📊 Response status:', response.status);
      console.log('📄 Response data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API call failed!');
      console.log('📊 Response status:', response.status);
      console.log('📄 Error data:', JSON.stringify(data, null, 2));
      
      if (data.error && data.error.includes('Secret Key')) {
        console.log('\n🔧 Possible solutions:');
        console.log('   1. Check if your DOJAH_SECRET_KEY is correct');
        console.log('   2. Verify your Dojah account is active');
        console.log('   3. Check if you have credit bureau access enabled');
        console.log('   4. Contact Dojah support if the issue persists');
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testDojahCredentials().catch(console.error);
