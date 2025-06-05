import React, {useState} from 'react';
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
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

// Hooks and contexts
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';

/**
 * Login screen component
 */
const LoginScreen = ({navigation}: {navigation: any}) => {
  // Theme
  const {colors} = useTheme();

  // Auth context
  const {login, loading} = useAuth();  // Local state
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode] = useState('+91'); // Remove setCountryCode since it's unused
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
    // Handle login
  const handleLogin = () => {
    // Validate mobile number
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    // Clear error and dismiss keyboard
    setError(null);
    Keyboard.dismiss();

    // Simply navigate to OTP screen with just the mobile number
    // The OTP API call will be triggered from the OTP screen
    navigation.navigate('OTP', {
      mobileNumber,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
        {/* App logo */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title and subtitle */}
        <Text style={[styles.title, {color: colors.text.primary}]}>
          Welcome to Adtip
        </Text>
        <Text style={[styles.subtitle, {color: colors.text.tertiary}]}>
          Please enter your mobile number to continue
        </Text>

        {/* Mobile number input */}
        <View
          style={[styles.inputContainer, {borderColor: colors.border}]}>
          <Text style={[styles.countryCode, {color: colors.text.primary}]}>
            {countryCode}
          </Text>
          <TextInput
            style={[styles.input, {color: colors.text.primary}]}
            placeholder="Enter mobile number"
            placeholderTextColor={colors.text.light}
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            maxLength={10}
            autoFocus
          />
        </View>

        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}        {/* Login button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            {backgroundColor: colors.primary},
            (!mobileNumber || mobileNumber.length < 10 || localLoading) &&
              styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={!mobileNumber || mobileNumber.length < 10 || localLoading}>
          {localLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Get OTP</Text>
          )}
        </TouchableOpacity>

        {/* Terms and conditions */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, {color: colors.text.tertiary}]}>
            By continuing, you agree to our
          </Text>
          <View style={styles.termsLinksContainer}>
            <TouchableOpacity>
              <Text style={[styles.termsLink, {color: colors.primary}]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, {color: colors.text.tertiary}]}>
              {' '}
              and{' '}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.termsLink, {color: colors.primary}]}>
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
