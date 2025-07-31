import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Hooks and contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthNavigatorParamList } from '../../types/navigation';

/**
 * Login screen component
 */
type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthNavigatorParamList,
  'Login'
>;

const LoginScreen = ({ navigation }: { navigation: LoginScreenNavigationProp }) => {
  // Theme
  const { colors } = useTheme();
  
  // Auth context
  const { login, loading } = useAuth();
  
  // Local state
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Local processing state
  
  // Ref to prevent multiple calls
  const isCallingRef = useRef(false);
  
  // Handle login
  const handleLogin = async () => {
    // Prevent multiple calls if already processing
    if (isCallingRef.current || isProcessing || loading) {
      console.log('[LoginScreen] Already processing, ignoring duplicate call');
      return;
    }

    // Validate mobile number
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    // Set processing flags and dismiss keyboard
    isCallingRef.current = true;
    setIsProcessing(true);
    setError(null);
    Keyboard.dismiss();

    try {
      console.log('[LoginScreen] Starting login process for:', mobileNumber);
      
      // Call the login function from AuthContext
      const response = await login(mobileNumber);
      
      console.log('[LoginScreen] Login response received:', {
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0
      });
      
      // Check for a valid response
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const otpResponse = response.data[0];
        
        console.log('[LoginScreen] Successfully sent OTP, navigating to OTP screen', {
          mobileNumber,
          id: otpResponse.id,
          isFirstTime: otpResponse.is_first_time
        });
        
        // --- THIS IS THE FIX ---
        // Navigate directly to the 'OTP' screen, which is a sibling in the AuthNavigator.
        navigation.navigate('OTP', {
          mobileNumber,
          id: otpResponse.id.toString(),
          isFirstTime: otpResponse.is_first_time,
        });
        
      } else {
        throw new Error('Invalid API response data');
      }
    } catch (err) {
      // Handle any errors during the process
      console.error('[LoginScreen] Login error in handleLogin:', err);
      const errorMessage =
        err && (err as any).message
          ? (err as any).message
          : 'Failed to send the OTP. Please try again.';
      setError(errorMessage);
    } finally {
      // Reset processing flags
      setIsProcessing(false);
      isCallingRef.current = false;
    }
  };
  
  // Handle mobile number change
  const handleMobileNumberChange = (text: string) => {
    // Only allow digits
    const cleanedText = text.replace(/[^0-9]/g, '');
    setMobileNumber(cleanedText);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };
  
  // Check if button should be disabled
  const isButtonDisabled = !mobileNumber || 
                          mobileNumber.length < 10 || 
                          loading || 
                          isProcessing || 
                          isCallingRef.current;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        {/* App logo */}
        <Image
          source={require('../../assets/images/AdTipLogoFinal.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* Title and subtitle */}
        <Text style={[styles.title, { color: colors.text.primary }]}>Welcome to Adtip</Text>
        <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
          Please enter your mobile number to continue
        </Text>
        
        {/* Mobile number input */}
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.countryCode, { color: colors.text.primary }]}>
            {countryCode}
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text.primary }]}
            placeholder="Enter mobile number"
            placeholderTextColor={colors.text.light}
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={handleMobileNumberChange}
            maxLength={10}
            autoFocus
            editable={!isProcessing && !loading} // Disable input while processing
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>
        
        {/* Error message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {/* Login button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: colors.primary },
            isButtonDisabled && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={isButtonDisabled}
          activeOpacity={isButtonDisabled ? 1 : 0.7}
        >
          {(loading || isProcessing) ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>Get OTP</Text>
          )}
        </TouchableOpacity>
        
        {/* Terms and conditions */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
            By continuing, you agree to our
          </Text>
          <View style={styles.termsLinksContainer}>
            <TouchableOpacity>
              <Text style={[styles.termsLink, { color: colors.primary }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.text.tertiary }]}> and </Text>
            <TouchableOpacity>
              <Text style={[styles.termsLink, { color: colors.primary }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: '#f43f5e',
    marginBottom: 16,
    alignSelf: 'center',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  termsLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;