import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

// Hooks and contexts
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';

// Types
import {RootStackParamList} from '../../types/navigation';

type OTPScreenProps = NativeStackScreenProps<RootStackParamList, 'OTP'>;

/**
 * OTP verification screen component
 */
const OTPScreen = ({navigation, route}: OTPScreenProps) => {  // Route params - now we only receive mobileNumber initially
  const {mobileNumber} = route.params;

  // Theme
  const {colors} = useTheme();
  
  // Auth context
  const {verifyOtp, login, loading} = useAuth();
  
  // Local state for OTP request/verification
  const [verifying, setVerifying] = useState(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState(true);
  const [otpRequestId, setOtpRequestId] = useState<string>('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Local state
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Input ref
  const otpInputRef = useRef<TextInput>(null);
  // Request OTP on component mount
  useEffect(() => {
    const requestOtp = async () => {
      setOtpRequestLoading(true);
      setError(null);
      
      try {
        // Call the API to get OTP
        const response = await login(mobileNumber);
        
        // Store the OTP request ID and first-time status
        setOtpRequestId(response.id.toString());
        setIsFirstTimeUser(response.is_first_time);
      } catch (err) {
        console.error('OTP request error:', err);
        setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
      } finally {
        setOtpRequestLoading(false);
      }
    };

    // Request the OTP when the component mounts
    requestOtp();
  }, [login, mobileNumber]);
  
  // Timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);// Handle OTP verification
  const handleVerifyOtp = async () => {
    // Validate OTP
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    // Clear error and dismiss keyboard
    setError(null);
    Keyboard.dismiss();
    
    // Show local loading indicator
    setVerifying(true);

    try {
      // Verify OTP with real authentication using the ID we got from the OTP request
      const userData = await verifyOtp(mobileNumber, otp, otpRequestId);

      // Navigate based on first time status
      if (isFirstTimeUser || userData.is_first_time === 1) {
        navigation.navigate('UserDetails');
      }
      // For returning users, AuthContext will automatically handle the navigation
      // by setting isAuthenticated to true, and App.tsx will switch to MainNavigator
    } catch (err) {
      // Handle error
      console.error('OTP verification error:', err);
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };  // Handle resend OTP with real API call
  const handleResendOtp = async () => {
    if (timer > 0) {
      return;
    }

    setResending(true);
    setError(null);

    try {
      // Call login API to resend OTP
      const response = await login(mobileNumber);
      
      // Update stored OTP request ID and first-time status
      setOtpRequestId(response.id.toString());
      setIsFirstTimeUser(response.is_first_time);
      
      // Reset timer
      setTimer(60);
      Alert.alert('Success', 'OTP resent successfully.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (text: string) => {
    // Allow only digits
    const formattedText = text.replace(/[^0-9]/g, '');
    setOtp(formattedText);
  };

  // Handle back button press
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.text.primary}]}>
            OTP Verification
          </Text>
          <View style={styles.placeholderView} />
        </View>        {/* Title and subtitle */}
        <Text style={[styles.title, {color: colors.text.primary}]}>
          Enter OTP
        </Text>
        
        {otpRequestLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, {color: colors.text.tertiary}]}>
              Sending OTP to your mobile number...
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.subtitle, {color: colors.text.tertiary}]}>
              We've sent a 6-digit verification code to{'\n'}
              {countryCode} {mobileNumber}
            </Text>

            {/* OTP input */}
            <TextInput
              ref={otpInputRef}
              style={[
                styles.otpInput,
                {
                  borderColor: colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={colors.text.light}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={handleOtpChange}
              autoFocus
            />
          </>
        )}        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        {/* Verify button - only shown after OTP is requested */}
        {!otpRequestLoading && (
          <TouchableOpacity
            style={[
              styles.verifyButton,
              {backgroundColor: colors.primary},
              (!otp || otp.length !== 6 || verifying) && styles.disabledButton,
            ]}
            onPress={handleVerifyOtp}
            disabled={!otp || otp.length !== 6 || verifying}>
            {verifying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        )}        {/* Resend OTP - only shown after initial OTP is requested */}
        {!otpRequestLoading && (
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={[styles.timerText, {color: colors.text.tertiary}]}>
                Resend code in{' '}
                <Text style={{color: colors.primary}}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.resendText, {color: colors.primary}]}>
                    Resend OTP
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Country code constant
const countryCode = '+91';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderView: {
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  otpInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#f43f5e',
    marginBottom: 16,
    alignSelf: 'center',
  },
  verifyButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OTPScreen;
