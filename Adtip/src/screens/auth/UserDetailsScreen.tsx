import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import * as ImagePicker from 'react-native-image-picker';

// Hooks and contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * User details form screen component (for first-time login)
 */
const UserDetailsScreen = ({ navigation }) => {
  // Theme
  const { colors } = useTheme();
  
  // Auth context
  const { user, updateUserDetails, loading } = useAuth();
  
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
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
      
      // In a real app, you would upload this to your server
      // For now, we just update the local state with the URI
      setFormData((prev) => ({
        ...prev,
        profile_image: selectedImage.uri,
      }));
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
      // Update user details
      await updateUserDetails({
        ...formData,
        is_first_time: 0,
      });
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      console.error('Update user details error:', err);
      Alert.alert('Error', 'Failed to update user details. Please try again.');
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Complete Your Profile
          </Text>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile image selection */}
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleSelectProfileImage}
          >
            {formData.profile_image ? (
              <Image
                source={{ uri: formData.profile_image }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                <Icon name="user" size={40} color="#ffffff" />
              </View>
            )}
            <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
              <Icon name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
          
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: formErrors.name ? colors.error : colors.border.default,
                  color: colors.text.primary 
                }
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.text.light}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
            />
            {formErrors.name ? (
              <Text style={styles.errorText}>{formErrors.name}</Text>
            ) : null}
          </View>
          
          {/* First Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              First Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: formErrors.firstName ? colors.error : colors.border.default,
                  color: colors.text.primary 
                }
              ]}
              placeholder="Enter your first name"
              placeholderTextColor={colors.text.light}
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
            />
            {formErrors.firstName ? (
              <Text style={styles.errorText}>{formErrors.firstName}</Text>
            ) : null}
          </View>
          
          {/* Last Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Last Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: formErrors.lastName ? colors.error : colors.border.default,
                  color: colors.text.primary 
                }
              ]}
              placeholder="Enter your last name"
              placeholderTextColor={colors.text.light}
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
            />
            {formErrors.lastName ? (
              <Text style={styles.errorText}>{formErrors.lastName}</Text>
            ) : null}
          </View>
          
          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: formErrors.emailId ? colors.error : colors.border.default,
                  color: colors.text.primary 
                }
              ]}
              placeholder="Enter your email address"
              placeholderTextColor={colors.text.light}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.emailId}
              onChangeText={(value) => handleChange('emailId', value)}
            />
            {formErrors.emailId ? (
              <Text style={styles.errorText}>{formErrors.emailId}</Text>
            ) : null}
          </View>
          
          {/* Gender */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Gender
            </Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: formData.gender === 'Male' 
                      ? colors.primary 
                      : colors.border.default,
                    backgroundColor: formData.gender === 'Male'
                      ? `${colors.primary}20`
                      : 'transparent'
                  }
                ]}
                onPress={() => handleSelectGender('Male')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { 
                      color: formData.gender === 'Male'
                        ? colors.primary
                        : colors.text.secondary
                    }
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: formData.gender === 'Female' 
                      ? colors.primary 
                      : colors.border.default,
                    backgroundColor: formData.gender === 'Female'
                      ? `${colors.primary}20`
                      : 'transparent'
                  }
                ]}
                onPress={() => handleSelectGender('Female')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { 
                      color: formData.gender === 'Female'
                        ? colors.primary
                        : colors.text.secondary
                    }
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: formData.gender === 'Other' 
                      ? colors.primary 
                      : colors.border.default,
                    backgroundColor: formData.gender === 'Other'
                      ? `${colors.primary}20`
                      : 'transparent'
                  }
                ]}
                onPress={() => handleSelectGender('Other')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { 
                      color: formData.gender === 'Other'
                        ? colors.primary
                        : colors.text.secondary
                    }
                  ]}
                >
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Date of Birth */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Date of Birth
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: formErrors.dob ? colors.error : colors.border.default,
                  color: colors.text.primary 
                }
              ]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.text.light}
              value={formData.dob}
              onChangeText={(value) => handleChange('dob', value)}
            />
            {formErrors.dob ? (
              <Text style={styles.errorText}>{formErrors.dob}</Text>
            ) : null}
          </View>
          
          {/* Profession */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Profession
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: formErrors.profession ? colors.error : colors.border.default,
                  color: colors.text.primary 
                }
              ]}
              placeholder="Enter your profession"
              placeholderTextColor={colors.text.light}
              value={formData.profession}
              onChangeText={(value) => handleChange('profession', value)}
            />
            {formErrors.profession ? (
              <Text style={styles.errorText}>{formErrors.profession}</Text>
            ) : null}
          </View>
          
          {/* Maternal Status */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Marital Status
            </Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: formData.maternal_status === 'Single' 
                      ? colors.primary 
                      : colors.border.default,
                    backgroundColor: formData.maternal_status === 'Single'
                      ? `${colors.primary}20`
                      : 'transparent'
                  }
                ]}
                onPress={() => handleSelectMaternalStatus('Single')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { 
                      color: formData.maternal_status === 'Single'
                        ? colors.primary
                        : colors.text.secondary
                    }
                  ]}
                >
                  Single
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: formData.maternal_status === 'Married' 
                      ? colors.primary 
                      : colors.border.default,
                    backgroundColor: formData.maternal_status === 'Married'
                      ? `${colors.primary}20`
                      : 'transparent'
                  }
                ]}
                onPress={() => handleSelectMaternalStatus('Married')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { 
                      color: formData.maternal_status === 'Married'
                        ? colors.primary
                        : colors.text.secondary
                    }
                  ]}
                >
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
              { backgroundColor: colors.primary },
              loading && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
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
