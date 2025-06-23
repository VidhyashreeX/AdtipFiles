// Verification script for initiate-call endpoint implementation
// Run with: node initiate_call_verification.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying initiate-call endpoint implementation...\n');

// Check 1: Verify ApiService initiateCall method
const apiServicePath = path.join(__dirname, 'src', 'services', 'ApiService.ts');
const apiServiceContent = fs.readFileSync(apiServicePath, 'utf8');

console.log('✅ Check 1: ApiService.initiateCall method');

// Check if endpoint uses correct path
if (apiServiceContent.includes('${FCM_SERVER_URL}/api/call/initiate-call')) {
  console.log('  ✅ Endpoint path is correct: /api/call/initiate-call');
} else {
  console.log('  ❌ Endpoint path is incorrect');
}

// Check if auth token is included
if (apiServiceContent.includes('Authorization') && apiServiceContent.includes('Bearer')) {
  console.log('  ✅ Auth token included in headers');
} else {
  console.log('  ❌ Auth token missing from headers');
}

// Check if request body format matches specification
const requestBodyPattern = /calleeInfo:.*platform.*token.*callerInfo:.*name.*token.*videoSDKInfo:.*meetingId.*token/s;
if (requestBodyPattern.test(apiServiceContent)) {
  console.log('  ✅ Request body format matches specification');
} else {
  console.log('  ❌ Request body format does not match specification');
}

console.log('\n✅ Check 2: Usage in WhatsAppCallManager');

// Check 2: Verify WhatsAppCallManager usage
const whatsAppCallManagerPath = path.join(__dirname, 'src', 'services', 'calling', 'WhatsAppCallManager.ts');
if (fs.existsSync(whatsAppCallManagerPath)) {
  const whatsAppCallManagerContent = fs.readFileSync(whatsAppCallManagerPath, 'utf8');
  
  if (whatsAppCallManagerContent.includes('ApiService.initiateCall')) {
    console.log('  ✅ WhatsAppCallManager uses ApiService.initiateCall');
  } else {
    console.log('  ❌ WhatsAppCallManager does not use ApiService.initiateCall');
  }
} else {
  console.log('  ⚠️ WhatsAppCallManager file not found');
}

console.log('\n✅ Check 3: Constants file');

// Check 3: Verify constants file has correct endpoint
const constantsPath = path.join(__dirname, 'src', 'constants', 'apiEndpoints.ts');
if (fs.existsSync(constantsPath)) {
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  
  if (constantsContent.includes('/api/call/initiate-call')) {
    console.log('  ✅ Constants file has correct endpoint definition');
  } else {
    console.log('  ❌ Constants file missing correct endpoint definition');
  }
} else {
  console.log('  ⚠️ Constants file not found');
}

console.log('\n✅ Check 4: FCM_SERVER_URL usage');

// Check 4: Verify FCM_SERVER_URL is used correctly
if (apiServiceContent.includes('FCM_SERVER_URL') && apiServiceContent.includes('/api/call/initiate-call')) {
  console.log('  ✅ FCM_SERVER_URL used correctly with /api/call/initiate-call');
} else {
  console.log('  ❌ FCM_SERVER_URL not used correctly');
}

console.log('\n📋 Sample request body format:');
console.log(`{
  "calleeInfo": {
    "platform": "ANDROID",
    "token": "dDSO0ZpZR_Ga-AymF8om9o:APA91bFgdrBqD0qk7Ir6_TEXWZXsxebQjmI2ReD8-9Vdl9yvuWJkDGVTgWIzkP2fnw-n4fEvpmb-kM6RSMjta7MU7ioXzc3gKvPrBFFTUfnpSUD2SZ43QxU"
  },
  "callerInfo": {
    "name": "S A",
    "token": "fxYhBCInQYKVPEU9YNUMhD:APA91bF1RIAxugB2UuUSmXkN4RVJw6MxB2Ov4NivhZ1ItRiygJ4LcPbdzjM7HPDTZ_Hh1Cn6Zsbmb1G2k6YazF2fUAM3A0q26fxacCotg3wcPZAW2fdvIRw"
  },
  "videoSDKInfo": {
    "meetingId": "2d1z-roik-u4q5",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MDIzMTI5NiwiZXhwIjoxNzUwMjMzMDk2fQ.RuasVpI68lTuyh5Xx0kQol3mXrBcq7m4unWJ9P4BpiY"
  }
}`);

console.log('\n🎯 Verification complete!');
