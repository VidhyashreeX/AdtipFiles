// Test script for saveVideoLike API endpoint
// Run this with: node test_saveVideoLike.js

const axios = require('axios');

const API_BASE_URL = 'https://api.adtip.in';

// Test data
const testData = {
  reelId: 4610,
  userId: 58422,
  like: 1,
  reelCreatorId: 11334
};

// You'll need to replace this with a valid auth token
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

async function testSaveVideoLike() {
  try {
    console.log('Testing saveVideoLike API...');
    console.log('Request data:', testData);
    
    const response = await axios.post(`${API_BASE_URL}/api/saveVideoLike`, testData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Error occurred:');
    
    if (error.response) {
      // Server responded with error status
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received:', error.message);
    } else {
      // Something else happened
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testSaveVideoLike();
