// Enhanced Login Screen with Better Error Handling and Recovery
// File: src/screens/auth/EnhancedLoginScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEnhancedAuth } from '../../hooks/useEnhancedAuth';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface EnhancedLoginScreenProps {
  navigation?: any;
}

const EnhancedLoginScreen: React.FC<EnhancedLoginScreenProps> = () => {
  // State
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Refs
  const mobileInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  
  // Hooks
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    authState,
    otpState,
    sendOtp,
    verifyOtp,
    retryLastOperation,
    resetOtpSession,
    handleNetworkRecovery,
    clearError
  } = useEnhancedAuth();

  // Effects
  useEffect(() => {
    if (authState.isAuthenticated) {
      // Navigate based on user completion status
      navigation.navigate('Main' as never);
    }
  }, [authState.isAuthenticated, navigation]);

  useEffect(() => {
    if (otpState.otpSent && step === 'mobile') {
      setStep('otp');
      setTimeout(() => otpInputRef.current?.focus(), 300);
    }
  }, [otpState.otpSent, step]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (authState.error || otpState.otpError) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authState.error, otpState.otpError, clearError]);

  // Validation
  const isValidMobileNumber = (number: string): boolean => {
    return /^[6-9]\d{9}$/.test(number);
  };

  const isValidOtp = (otpValue: string): boolean => {
    return /^\d{6}$/.test(otpValue);
  };

  // Handle mobile number submission
  const handleMobileSubmit = async (): Promise<void> => {
    if (!isValidMobileNumber(mobileNumber)) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'Please accept our Terms & Conditions and Privacy Policy to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await sendOtp(mobileNumber);
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async (): Promise<void> => {
    if (!isValidOtp(otp)) {
      Alert.alert(
        'Invalid OTP',
        'Please enter a valid 6-digit OTP.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await verifyOtp(otp);
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  // Handle resend OTP
  const handleResendOtp = async (): Promise<void> => {
    try {
      setOtp('');
      await sendOtp(mobileNumber);
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  // Handle back navigation
  const handleBack = (): void => {
    if (step === 'otp') {
      setStep('mobile');
      setOtp('');
      resetOtpSession();
    } else {
      navigation.goBack();
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render error message
  const renderErrorMessage = (): React.ReactNode => {
    const error = authState.error || otpState.otpError;
    if (!error) return null;

    const isNetworkError = error.includes('network') || error.includes('connection');
    
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
        <View style={styles.errorContent}>
          <Icon 
            name={isNetworkError ? 'wifi-off' : 'error-outline'} 
            size={20} 
            color={colors.error} 
          />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
        <View style={styles.errorActions}>
          {isNetworkError && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleNetworkRecovery}
              disabled={authState.isLoading || otpState.otpLoading}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: colors.surface }]}
            onPress={clearError}
          >
            <Text style={[styles.dismissButtonText, { color: colors.text.primary }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render cooldown message
  const renderCooldownMessage = (): React.ReactNode => {
    if (!otpState.isInCooldown) return null;

    return (
      <View style={[styles.cooldownContainer, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
        <Icon name="schedule" size={20} color={colors.warning} />
        <Text style={[styles.cooldownText, { color: colors.warning }]}>
          Too many attempts. Please wait before trying again.
        </Text>
      </View>
    );
  };

  // Render mobile number step
  const renderMobileStep = (): React.ReactNode => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Enter Mobile Number
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        We'll send you a verification code
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.countryCode, { color: colors.text.primary }]}>+91</Text>
        <TextInput
          ref={mobileInputRef}
          style={[
            styles.mobileInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text.primary,
            }
          ]}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder="Mobile Number"
          placeholderTextColor={colors.text.light}
          keyboardType="numeric"
          maxLength={10}
          autoFocus
          editable={!authState.isLoading && !otpState.otpLoading}
        />
      </View>

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          disabled={authState.isLoading || otpState.otpLoading}
        >
          <View style={[
            styles.checkboxInner,
            { 
              borderColor: colors.border,
              backgroundColor: agreedToTerms ? colors.primary : 'transparent'
            }
          ]}>
            {agreedToTerms && (
              <Icon name="check" size={14} color="white" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={[styles.termsText, { color: colors.text.secondary }]}>
          I agree to the{' '}
          <Text style={{ color: colors.primary }}>Terms & Conditions</Text>
          {' '}and{' '}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: colors.primary,
            opacity: (!isValidMobileNumber(mobileNumber) || !agreedToTerms || authState.isLoading || otpState.otpLoading) ? 0.5 : 1
          }
        ]}
        onPress={handleMobileSubmit}
        disabled={!isValidMobileNumber(mobileNumber) || !agreedToTerms || authState.isLoading || otpState.otpLoading}
      >
        {authState.isLoading || otpState.otpLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render OTP step
  const renderOtpStep = (): React.ReactNode => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Enter Verification Code
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        We've sent a 6-digit code to{'\n'}+91 {mobileNumber}
      </Text>

      <TextInput
        ref={otpInputRef}
        style={[
          styles.otpInput,
          {
            backgroundColor: colors.surface,
            borderColor: otpState.otpError ? colors.error : colors.border,
            color: colors.text.primary,
          }
        ]}
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter 6-digit OTP"
        placeholderTextColor={colors.text.light}
        keyboardType="numeric"
        maxLength={6}
        textAlign="center"
        editable={!otpState.otpLoading && !otpState.isInCooldown}
      />

      {/* OTP Status Information */}
      <View style={styles.otpStatusContainer}>
        {otpState.timeUntilExpiry > 0 && (
          <Text style={[styles.statusText, { color: colors.text.secondary }]}>
            Code expires in {formatTime(otpState.timeUntilExpiry)}
          </Text>
        )}
        
        {otpState.remainingAttempts > 0 && otpState.remainingAttempts < 3 && (
          <Text style={[styles.statusText, { color: colors.warning }]}>
            {otpState.remainingAttempts} attempts remaining
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: colors.primary,
            opacity: (!isValidOtp(otp) || otpState.otpLoading || otpState.isInCooldown) ? 0.5 : 1
          }
        ]}
        onPress={handleOtpSubmit}
        disabled={!isValidOtp(otp) || otpState.otpLoading || otpState.isInCooldown}
      >
        {otpState.otpLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      {/* Resend Section */}
      <View style={styles.resendContainer}>
        {otpState.timeUntilResend > 0 ? (
          <Text style={[styles.resendText, { color: colors.text.secondary }]}>
            Resend code in {otpState.timeUntilResend}s
          </Text>
        ) : otpState.canResend ? (
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={otpState.otpLoading || otpState.isInCooldown}
          >
            <Text style={[styles.resendButtonText, { color: colors.primary }]}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.resendText, { color: colors.text.secondary }]}>
            Maximum resends reached
          </Text>
        )}
      </View>

      {/* Change Number */}
      <TouchableOpacity
        style={styles.changeNumberButton}
        onPress={handleBack}
        disabled={otpState.otpLoading}
      >
        <Text style={[styles.changeNumberText, { color: colors.primary }]}>
          Change Mobile Number
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={handleBack}
            >
              <Icon name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Sign In
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Error Messages */}
          {renderErrorMessage()}
          {renderCooldownMessage()}

          {/* Main Content */}
          <View style={styles.content}>
            {step === 'mobile' ? renderMobileStep() : renderOtpStep()}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              Having trouble? Contact our support team
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  errorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dismissButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  cooldownText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  mobileInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  otpInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    width: '80%',
    marginBottom: 16,
  },
  otpStatusContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 40,
  },
  statusText: {
    fontSize: 14,
    marginVertical: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    width: '100%',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendText: {
    fontSize: 14,
  },
  changeNumberButton: {
    padding: 12,
  },
  changeNumberText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default EnhancedLoginScreen;