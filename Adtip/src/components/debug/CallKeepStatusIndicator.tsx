import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { CallKeepService } from '../../services/calling/CallKeepService';

/**
 * CallKeep Status Indicator Component
 * 
 * Shows real-time CallKeep status and phone account information
 * Helps debug CallKeep issues quickly
 */
const CallKeepStatusIndicator: React.FC = () => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<{
    hasPhoneAccount: boolean;
    isCallKeepAvailable: boolean;
    canDisplayCalls: boolean;
    statusMessage: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only show in debug builds
  if (!__DEV__) {
    return null;
  }

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const callKeepService = CallKeepService.getInstance();
      const phoneAccountStatus = await callKeepService.checkPhoneAccountStatus();
      setStatus(phoneAccountStatus);
    } catch (error) {
      console.error('[CallKeepStatusIndicator] Error checking status:', error);
      setStatus({
        hasPhoneAccount: false,
        isCallKeepAvailable: false,
        canDisplayCalls: false,
        statusMessage: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showDetailedStatus = () => {
    if (!status) return;

    const details = [
      `Phone Account: ${status.hasPhoneAccount ? '✅ Enabled' : '❌ Disabled'}`,
      `CallKeep Available: ${status.isCallKeepAvailable ? '✅ Yes' : '❌ No'}`,
      `Can Display Calls: ${status.canDisplayCalls ? '✅ Yes' : '❌ No'}`,
      `Status: ${status.statusMessage}`
    ].join('\n\n');

    Alert.alert(
      'CallKeep Status Details',
      details,
      [
        { text: 'Refresh', onPress: checkStatus },
        { text: 'OK' }
      ]
    );
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusColor = () => {
    if (!status) return colors.text;
    if (status.canDisplayCalls) return '#30D158'; // Green
    if (status.hasPhoneAccount) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (!status) return 'Unknown';
    if (status.canDisplayCalls) return 'Ready';
    if (status.hasPhoneAccount) return 'Partial';
    return 'Not Ready';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={showDetailedStatus}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>
          CallKeep:
        </Text>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      <Text style={[styles.hint, { color: colors.text + '80' }]}>
        Tap for details
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 120,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  hint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default CallKeepStatusIndicator;
