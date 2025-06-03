import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  PermissionsAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import Geolocation from 'react-native-geolocation-service';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// Hooks and contexts
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';

// Types
import {RootStackParamList} from '../../types/navigation';

type UserDetailsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

/**
 * User details form screen component (for first-time login)
 */
const UserDetailsScreen = () => {
  // Theme
  const {colors} = useTheme();

  // Navigation
  const navigation = useNavigation<UserDetailsScreenNavigationProp>();

  // Auth context
  const {user, updateUserDetails, loading} = useAuth();

  // Location state
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    address: '',
  });

  // Date picker state
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    emailId: user?.emailId || '',
    gender: user?.gender || 'Male',
    dob: user?.dob || '',
    profile_image: user?.profile_image || null,
    profession: user?.profession || '',
    maternal_status: user?.maternal_status || 'Single',
  });

  // Request location permission and get current position
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Get current position
          Geolocation.getCurrentPosition(
            position => {
              console.log('Got location', position);
              setLocation({
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString(),
                address: 'Current Location', // You would use a geocoding service to get the actual address
              });

              // Update form data with location
              setFormData(prev => ({
                ...prev,
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString(),
              }));
            },
            error => {
              console.error('Location error', error);
              Alert.alert(
                'Error',
                'Failed to get your location. Please check your settings.',
              );
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
          );
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.error('Permission request error:', err);
      }
    };

    requestLocationPermission();
  }, []);

  // Validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    firstName: '',
    lastName: '',
    emailId: '',
    dob: '',
    profession: '',
  });
  // Form field change handler
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));

    // Clear error for this field
    if (field in formErrors && formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({...prev, [field]: ''}));
    }
  };
  // Handle profile image selection
  const handleSelectProfileImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      });

      if (result.didCancel || !result.assets || !result.assets[0]) {
        return;
      }

      const selectedImage = result.assets[0];

      if (selectedImage.uri) {
        // In a real app, you would upload this to your server
        // For now, we just update the local state with the URI
        setFormData(prev => ({
          ...prev,
          profile_image: selectedImage.uri || null,
        }));
      }
    } catch (err) {
      console.error('Image selection error:', err);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Gender selection handler
  const handleSelectGender = (gender: string) => {
    handleChange('gender', gender);
  };

  // Maternal status selection handler
  const handleSelectMaternalStatus = (status: string) => {
    handleChange('maternal_status', status);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: '',
      firstName: '',
      lastName: '',
      emailId: '',
      dob: '',
      profession: '',
    };

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    // Validate email (basic validation)
    if (!formData.emailId.trim()) {
      errors.emailId = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.emailId)) {
      errors.emailId = 'Email is invalid';
      isValid = false;
    }

    // Validate date of birth
    if (!formData.dob.trim()) {
      errors.dob = 'Date of birth is required';
      isValid = false;
    }

    // Validate profession
    if (!formData.profession.trim()) {
      errors.profession = 'Profession is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };
  // Submit form handler
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Update user details with isSaveUserDetails set to 1
      await updateUserDetails({
        ...formData,
        is_first_time: 0,
        isSaveUserDetails: 1,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{name: 'Main'}],
      });
    } catch (err) {
      console.error('Update user details error:', err);
      Alert.alert('Error', 'Failed to update user details. Please try again.');
    }
  };

  // Move inline gender/maternal_status backgroundColor styles to StyleSheet
  const getGenderBg = (gender: string) => [
    styles.genderButton,
    gender === 'Male' && {backgroundColor: `${colors.primary}20`},
    gender === 'Female' && {backgroundColor: `${colors.primary}20`},
    gender === 'Other' && {backgroundColor: `${colors.primary}20`},
  ];
  const getMaternalStatusBg = (status: string) => [
    styles.maternalStatusButton,
    status === 'Single' && {backgroundColor: `${colors.primary}20`},
    status === 'Married' && {backgroundColor: `${colors.primary}20`},
  ];

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: colors.text.primary}]}>
            Complete Your Profile
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}>
          {/* Profile image selection */}
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleSelectProfileImage}>
            {formData.profile_image ? (
              <Image
                source={{uri: formData.profile_image}}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  {backgroundColor: colors.primary},
                ]}>
                <Icon name="user" size={40} color="#ffffff" />
              </View>
            )}
            <View
              style={[styles.cameraButton, {backgroundColor: colors.primary}]}>
              <Icon name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: formErrors.name ? colors.error : colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.text.light}
              value={formData.name}
              onChangeText={value => handleChange('name', value)}
            />
            {formErrors.name ? (
              <Text style={styles.errorText}>{formErrors.name}</Text>
            ) : null}
          </View>

          {/* First Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              First Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: formErrors.firstName
                    ? colors.error
                    : colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter your first name"
              placeholderTextColor={colors.text.light}
              value={formData.firstName}
              onChangeText={value => handleChange('firstName', value)}
            />
            {formErrors.firstName ? (
              <Text style={styles.errorText}>{formErrors.firstName}</Text>
            ) : null}
          </View>

          {/* Last Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Last Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: formErrors.lastName
                    ? colors.error
                    : colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter your last name"
              placeholderTextColor={colors.text.light}
              value={formData.lastName}
              onChangeText={value => handleChange('lastName', value)}
            />
            {formErrors.lastName ? (
              <Text style={styles.errorText}>{formErrors.lastName}</Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: formErrors.emailId
                    ? colors.error
                    : colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter your email address"
              placeholderTextColor={colors.text.light}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.emailId}
              onChangeText={value => handleChange('emailId', value)}
            />
            {formErrors.emailId ? (
              <Text style={styles.errorText}>{formErrors.emailId}</Text>
            ) : null}
          </View>

          {/* Gender */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Gender
            </Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor:
                      formData.gender === 'Male'
                        ? colors.primary
                        : colors.border,
                  },
                  getGenderBg(formData.gender),
                ]}
                onPress={() => handleSelectGender('Male')}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        formData.gender === 'Male'
                          ? colors.primary
                          : colors.text.secondary,
                    },
                  ]}>
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor:
                      formData.gender === 'Female'
                        ? colors.primary
                        : colors.border,
                  },
                  getGenderBg(formData.gender),
                ]}
                onPress={() => handleSelectGender('Female')}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        formData.gender === 'Female'
                          ? colors.primary
                          : colors.text.secondary,
                    },
                  ]}>
                  Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor:
                      formData.gender === 'Other'
                        ? colors.primary
                        : colors.border,
                  },
                  getGenderBg(formData.gender),
                ]}
                onPress={() => handleSelectGender('Other')}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        formData.gender === 'Other'
                          ? colors.primary
                          : colors.text.secondary,
                    },
                  ]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Date of Birth
            </Text>{' '}
            <TouchableOpacity
              style={[
                styles.input,
                {
                  borderColor: formErrors.dob ? colors.error : colors.border,
                },
                styles.inputContainer,
              ]}
              onPress={() => setDatePickerOpen(true)}>
              <Text style={{color: colors.text.primary}}>
                {formData.dob ? formData.dob : 'DD/MM/YYYY'}
              </Text>
            </TouchableOpacity>
            {formErrors.dob ? (
              <Text style={styles.errorText}>{formErrors.dob}</Text>
            ) : null}
            {/* Date Picker */}
            <DatePicker
              modal
              open={datePickerOpen}
              date={selectedDate ? new Date(selectedDate) : new Date()}
              mode="date"
              onConfirm={date => {
                setDatePickerOpen(false);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                handleChange('dob', formattedDate);
                setSelectedDate(date);
              }}
              onCancel={() => {
                setDatePickerOpen(false);
              }}
              locale="en"
            />
          </View>

          {/* Profession */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Profession
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: formErrors.profession
                    ? colors.error
                    : colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter your profession"
              placeholderTextColor={colors.text.light}
              value={formData.profession}
              onChangeText={value => handleChange('profession', value)}
            />
            {formErrors.profession ? (
              <Text style={styles.errorText}>{formErrors.profession}</Text>
            ) : null}
          </View>

          {/* Maternal Status */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.text.secondary}]}>
              Marital Status
            </Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor:
                      formData.maternal_status === 'Single'
                        ? colors.primary
                        : colors.border,
                  },
                  getMaternalStatusBg(formData.maternal_status),
                ]}
                onPress={() => handleSelectMaternalStatus('Single')}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        formData.maternal_status === 'Single'
                          ? colors.primary
                          : colors.text.secondary,
                    },
                  ]}>
                  Single
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor:
                      formData.maternal_status === 'Married'
                        ? colors.primary
                        : colors.border,
                  },
                  getMaternalStatusBg(formData.maternal_status),
                ]}
                onPress={() => handleSelectMaternalStatus('Married')}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        formData.maternal_status === 'Married'
                          ? colors.primary
                          : colors.text.secondary,
                    },
                  ]}>
                  Married
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Submit button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {backgroundColor: colors.primary},
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginVertical: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputContainer: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    height: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  genderButton: {
    // ...existing gender button styles...
  },
  maternalStatusButton: {
    // ...existing maternal status button styles...
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#f43f5e',
    marginTop: 4,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserDetailsScreen;
