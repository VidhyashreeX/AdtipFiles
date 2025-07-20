import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import CallKeepService from '../../services/calling/CallKeepService';

/**
 * Debug component to show CallKeep initialization status
 * This can be temporarily added to MainNavigator to verify the fix
 */
const CallKeepDebugInfo: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const [callKeepStatus, setCallKeepStatus] = useState<string>('Not checked');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkCallKeepStatus = async () => {
    try {
      const service = CallKeepService.getInstance();
      const hasPermissions = await service.checkPermissions();
      setCallKeepStatus(hasPermissions ? 'Initialized with permissions' : 'Initialized without permissions');
      setLastCheck(new Date());
    } catch (error) {
      setCallKeepStatus(`Error: ${error}`);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Check status after a delay to allow initialization
    const timer = setTimeout(() => {
      checkCallKeepStatus();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isInitialized]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CallKeep Debug Info</Text>
      <Text style={styles.info}>Auth Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</Text>
      <Text style={styles.info}>Auth Initialized: {isInitialized ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>CallKeep Status: {callKeepStatus}</Text>
      {lastCheck && (
        <Text style={styles.info}>Last Check: {lastCheck.toLocaleTimeString()}</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={checkCallKeepStatus}>
        <Text style={styles.buttonText}>Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  info: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 5,
    borderRadius: 3,
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default CallKeepDebugInfo;
