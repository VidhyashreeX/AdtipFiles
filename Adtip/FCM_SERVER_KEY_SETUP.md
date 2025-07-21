# FCM Server Key Setup Guide

## Overview

The DirectFCMService requires an FCM Server Key to send push notifications directly from the React Native app. Here are the different ways to configure it:

## Method 1: Environment Variables (Recommended for Development)

### 1. Create a `.env` file in your project root:

```bash
# adtip-reactnative/Adtip/.env
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_SENDER_ID=your_sender_id_here
```

### 2. Install react-native-config:

```bash
npm install react-native-config
```

### 3. Update DirectFCMService to use environment variables:

```typescript
// In src/services/DirectFCMService.ts
import Config from 'react-native-config';

private async getFCMServerKey(): Promise<string | null> {
  try {
    // Option 1: From react-native-config
    if (Config.FCM_SERVER_KEY) {
      return Config.FCM_SERVER_KEY;
    }

    // Fallback to other methods...
    return null;
  } catch (error) {
    console.error('[DirectFCMService] Error getting FCM server key:', error);
    return null;
  }
}
```

## Method 2: AsyncStorage (For Runtime Configuration)

### Set the key programmatically:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set FCM Server Key (call this once during app setup)
await AsyncStorage.setItem('@fcm_server_key', 'your_fcm_server_key_here');
await AsyncStorage.setItem('@fcm_sender_id', 'your_sender_id_here');
```

### The DirectFCMService will automatically read from AsyncStorage:

```typescript
// Already implemented in DirectFCMService.ts
const storedKey = await AsyncStorage.getItem('@fcm_server_key');
```

## Method 3: Secure API Endpoint (Recommended for Production)

### Create an API endpoint to fetch the FCM key:

```typescript
// In DirectFCMService.ts, add this method:
private async fetchFCMKeyFromAPI(): Promise<string | null> {
  try {
    const response = await fetch('https://your-api.com/fcm-config', {
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`,
      },
    });
    
    const data = await response.json();
    return data.fcmServerKey;
  } catch (error) {
    console.error('[DirectFCMService] Error fetching FCM key from API:', error);
    return null;
  }
}

// Update getFCMServerKey method:
private async getFCMServerKey(): Promise<string | null> {
  try {
    // Option 3: From secure API
    const apiKey = await this.fetchFCMKeyFromAPI();
    if (apiKey) {
      return apiKey;
    }

    // Fallback to other methods...
    return null;
  } catch (error) {
    console.error('[DirectFCMService] Error getting FCM server key:', error);
    return null;
  }
}
```

## Method 4: Build-time Configuration

### For React Native CLI projects, use metro.config.js:

```javascript
// metro.config.js
const {getDefaultConfig} = require('@react-native/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // Add build-time environment variables
  config.resolver.alias = {
    ...config.resolver.alias,
    '@env': require.resolve('./env.js'),
  };
  
  return config;
})();
```

### Create env.js:

```javascript
// env.js
export const FCM_SERVER_KEY = 'your_fcm_server_key_here';
export const FCM_SENDER_ID = 'your_sender_id_here';
```

## Getting Your FCM Server Key

### 1. Go to Firebase Console:
- Visit https://console.firebase.google.com/
- Select your project

### 2. Navigate to Project Settings:
- Click the gear icon → Project settings
- Go to "Cloud Messaging" tab

### 3. Find Server Key:
- Look for "Server key" under "Project credentials"
- Copy the key (starts with "AAAA...")

### 4. Get Sender ID:
- Find "Sender ID" in the same section
- This is your numeric sender ID

## Security Best Practices

### ⚠️ Important Security Notes:

1. **Never commit FCM keys to version control**
2. **Use environment variables for development**
3. **Use secure API endpoints for production**
4. **Rotate keys regularly**
5. **Restrict key usage in Firebase Console**

### Restrict FCM Key Usage:

1. In Firebase Console → Project Settings → Cloud Messaging
2. Click "Manage API in Google Cloud Console"
3. Set IP restrictions and referrer restrictions
4. Limit to specific Android/iOS app packages

## Testing the Setup

### Test if FCM key is working:

```typescript
// Add this test method to DirectFCMService
async testFCMConnection(): Promise<boolean> {
  try {
    const serverKey = await this.getFCMServerKey();
    if (!serverKey) {
      console.log('❌ FCM Server Key not configured');
      return false;
    }

    console.log('✅ FCM Server Key configured successfully');
    return true;
  } catch (error) {
    console.error('❌ FCM connection test failed:', error);
    return false;
  }
}
```

### Call the test method:

```typescript
// In your app initialization
const fcmService = new DirectFCMService();
await fcmService.initialize();
const isWorking = await fcmService.testFCMConnection();
console.log('FCM Setup Status:', isWorking ? 'Working' : 'Not Working');
```

## Troubleshooting

### Common Issues:

1. **"FCM Server Key not available"** - Key not set or incorrect format
2. **"Authentication failed"** - Invalid or expired key
3. **"Permission denied"** - Key restrictions too strict
4. **"Invalid registration token"** - Device token issues

### Debug Steps:

1. Check if key is being loaded: `console.log('FCM Key:', await getFCMServerKey())`
2. Verify key format: Should start with "AAAA" and be ~150+ characters
3. Test with a simple FCM API call
4. Check Firebase Console for error logs
