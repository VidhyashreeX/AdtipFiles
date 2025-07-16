// Test script to check if the saveVideoLike route exists
// Run this with: node test_route_check.js

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
// Get this from your app's AsyncStorage or login response
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1ODQyMiwiZW1haWwiOiJSMTdAZ21haWwuY29tIiwiaWF0IjoxNzUyNDMyMTQxLCJleHAiOjE3ODM5NjgxNDF9.OjsbdDba_jEjTcAJtIZqGXOmXZN9Se4P3ex5Xv-VqWo';

async function testSaveVideoLike() {
  try {
    console.log('Testing saveVideoLike endpoint...');
    console.log('URL:', `${API_BASE_URL}/api/saveVideoLike`);
    console.log('Data:', testData);
    
    const response = await axios.post(`${API_BASE_URL}/api/saveVideoLike`, testData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error details:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
      console.log('Request URL:', error.config.url);
      console.log('Request Method:', error.config.method);
      console.log('Base URL:', error.config.baseURL);
    } else if (error.request) {
      console.log('Network Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Also test without /api prefix to see what happens
async function testWithoutApiPrefix() {
  try {
    console.log('\nTesting WITHOUT /api prefix...');
    console.log('URL:', `${API_BASE_URL}/saveVideoLike`);
    
    const response = await axios.post(`${API_BASE_URL}/saveVideoLike`, testData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success (without /api):', response.data);
  } catch (error) {
    console.log('❌ Error (without /api):');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run tests
console.log('=== Testing saveVideoLike Route ===');
testSaveVideoLike().then(() => {
  testWithoutApiPrefix();
});
