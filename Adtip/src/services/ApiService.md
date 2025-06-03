# API Service Documentation

## Overview
The API service provides methods to interact with the ADTIP backend API. It handles authentication, error handling, and provides typed responses for better developer experience.

## Usage Examples

### Authentication

```typescript
// Send OTP
const sendOtp = async () => {
  try {
    const response = await ApiService.sendLoginOtp({
      mobileNumber: '9876543210',
      userType: '2'
    });
    console.log('OTP sent:', response);
  } catch (error) {
    console.error('Error sending OTP:', error);
  }
}

// Verify OTP
const verifyOtp = async () => {
  try {
    const response = await ApiService.verifyOtp({
      mobile_number: '9876543210',
      otp: '123456',
      id: '12345'
    });
    console.log('User verified:', response);
  } catch (error) {
    console.error('Error verifying OTP:', error);
  }
}

// Logout
const logout = async () => {
  try {
    await ApiService.logout('12345');
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error logging out:', error);
  }
}
```

### Home Page

```typescript
// Get wallet balance
const getBalance = async () => {
  try {
    const response = await ApiService.getWalletBalance('12345');
    console.log('Balance:', response.availableBalance);
  } catch (error) {
    console.error('Error getting balance:', error);
  }
}

// List posts
const getPosts = async () => {
  try {
    const response = await ApiService.listPosts({
      category: 0,
      page: 1,
      limit: 10,
      loggined_user_id: 12345
    });
    console.log('Posts:', response.data);
  } catch (error) {
    console.error('Error getting posts:', error);
  }
}
```

### TipTube

```typescript
// Get videos
const getVideos = async () => {
  try {
    const response = await ApiService.getVideos('12345', 0, 1);
    console.log('Videos:', response);
  } catch (error) {
    console.error('Error getting videos:', error);
  }
}
```

### TipCalls

```typescript
// Get users
const getUsers = async () => {
  try {
    const response = await ApiService.getUsers({
      id: 0,
      page: 1,
      limit: 20,
      language: [4],
      interest: [2],
      user_id: null,
      search_by_name: '',
      loggined_user_id: 12345,
      sortBy: {}
    });
    console.log('Users:', response.data);
  } catch (error) {
    console.error('Error getting users:', error);
  }
}
```

## Error Handling

All API methods include proper error handling. Errors are parsed and returned as Error objects with appropriate messages.

```typescript
try {
  const response = await ApiService.getWalletBalance('12345');
  // Process response
} catch (error) {
  // error is an Error object with server message when available
  console.error('Error:', error.message);
}
```
