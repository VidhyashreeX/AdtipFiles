import React from 'react';

const SimpleApp = () => {
  console.log('SimpleApp is rendering...');
  
  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ 
        color: '#333',
        fontSize: '32px',
        marginBottom: '20px'
      }}>
        🎉 AdTip Web App is Working!
      </h1>
      <p style={{ 
        fontSize: '18px',
        color: '#666',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        React is successfully running in your browser
      </p>
      <div style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        ✅ Success! The web app is live.
      </div>
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>AdTip Features Preview:</h3>
        <ul style={{ color: '#666', lineHeight: '1.8', textAlign: 'left' }}>
          <li>🎥 Video Feed - Watch and earn</li>
          <li>💰 Rewards System - Complete tasks</li>
          <li>🎮 Gaming Hub - Play games</li>
          <li>👥 Social Features - Connect with friends</li>
          <li>📊 Analytics - Track progress</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleApp;