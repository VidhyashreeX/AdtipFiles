import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Import API service
import ApiService from '../../services/ApiService';
import { handleProfileImageUploadResult, createFreshProfileImageUrl } from '../../utils/ProfileImageUtils';

// Import enhanced validation and image upload
import { validateProfile, ValidationError, formatValidationErrors } from '../../utils/profileValidation';
import { updateProfileImage } from '../../utils/profileImageUpload';

// Define navigation param list
type RootStackParamList = {
  EditProfile: undefined;
  Settings: undefined;
  CreateChannel: undefined;
  FollowersList: { followers: any[] };
  FollowingsList: { followings: any[] };
  Comments: { postId: number };
  PostDetail: { postId: number };
  TipShorts: undefined;
  Earnings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define types for API data
interface Profession {
  id: number;
  name: string;
}

interface Interest {
  id: number;
  name: string;
}

interface Language {
  id: number;
  name: string;
}

const EditProfile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUserDetails } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  
  // Form state - initialized with user data
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.emailId || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(user?.gender || '');
  const [profession, setProfession] = useState<string>(user?.profession || '');
  const [maternalStatus, setMaternalStatus] = useState<string>(user?.maternal_status || '');
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile_number || '');
  const [address, setAddress] = useState<string>(user?.address || '');
  const [pincode, setPincode] = useState<string>(user?.pincode || '');

  // Helper function to parse date safely
  const parseDateSafely = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'string') {
        if (dateValue.includes('/')) {
          // Format: DD/MM/YYYY
          const [day, month, year] = dateValue.split('/').map(Number);
          return new Date(year, month - 1, day);
        } else if (dateValue.includes('-')) {
          // Format: DD-MM-YYYY or YYYY-MM-DD
          const parts = dateValue.split('-');
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            return new Date(dateValue);
          } else {
            // DD-MM-YYYY format
            const [day, month, year] = parts.map(Number);
            return new Date(year, month - 1, day);
          }
        } else {
          return new Date(dateValue);
        }
      } else {
        return new Date(dateValue);
      }
    } catch (error) {
      console.error('[EditProfile] Error parsing date:', error, dateValue);
      return null;
    }
  };

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({
    name: user?.name || '',
    email: user?.emailId || '',
    bio: user?.bio || '',
    dob: parseDateSafely(user?.dob),
    gender: user?.gender || '',
    profession: user?.profession || '',
    maternalStatus: user?.maternal_status || '',
    interests: user?.interests?.map((interest: any) => typeof interest === 'object' ? interest.id : interest) || [],
    languages: user?.languages?.map((language: any) => typeof language === 'object' ? language.id : language) || [],
    mobileNumber: user?.mobile_number || '',
    address: user?.address || '',
    pincode: user?.pincode || ''
  });

  // API data
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Modal states
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize DOB from user data
  useEffect(() => {
    if (user?.dob) {
      const parsedDate = parseDateSafely(user.dob);
      if (parsedDate) {
        console.log('[EditProfile] Setting DOB:', parsedDate);
        setDob(parsedDate);
      } else {
        console.warn('[EditProfile] Could not parse DOB:', user.dob);
      }
    }
  }, [user?.dob]);

  // Initialize original values when user data changes
  useEffect(() => {
    setOriginalValues({
      name: user?.name || '',
      email: user?.emailId || '',
      bio: user?.bio || '',
      dob: parseDateSafely(user?.dob),
      gender: user?.gender || '',
      profession: user?.profession || '',
      maternalStatus: user?.maternal_status || '',
      interests: user?.interests?.map((interest: any) => typeof interest === 'object' ? interest.id : interest) || [],
      languages: user?.languages?.map((language: any) => typeof language === 'object' ? language.id : language) || [],
      mobileNumber: user?.mobile_number || '',
      address: user?.address || '',
      pincode: user?.pincode || ''
    });
  }, [user]);

  // Fetch API data on component mount
  useEffect(() => {
    fetchApiData();
  }, []);

  // Initialize selected interests and languages from user data
  useEffect(() => {
    console.log('[EditProfile] Initializing interests and languages:', {
      userInterests: user?.interests,
      userLanguages: user?.languages,
      availableInterests: interests.length,
      availableLanguages: languages.length
    });

    if (user?.interests && interests.length > 0) {
      const userInterestIds = user.interests.map((interest: any) =>
        typeof interest === 'object' ? interest.id : interest
      );
      console.log('[EditProfile] Setting user interest IDs:', userInterestIds);
      setSelectedInterests(userInterestIds);
    }

    if (user?.languages && languages.length > 0) {
      const userLanguageIds = user.languages.map((language: any) =>
        typeof language === 'object' ? language.id : language
      );
      console.log('[EditProfile] Setting user language IDs:', userLanguageIds);
      setSelectedLanguages(userLanguageIds);
    }
  }, [user?.interests, user?.languages, interests, languages]);
      
  // Helper function to check if a field has changed
  const hasFieldChanged = (fieldName: string, currentValue: any): boolean => {
    const originalValue = originalValues[fieldName as keyof typeof originalValues];
    
    if (fieldName === 'dob') {
      const originalDob = originalValue as Date | null;
      if (!originalDob && !currentValue) return false;
      if (!originalDob || !currentValue) return true;
      return formatDate(originalDob) !== formatDate(currentValue);
    }
    
    if (fieldName === 'interests' || fieldName === 'languages') {
      const originalArray = originalValue as number[];
      if (!originalArray && !currentValue) return false;
      if (!originalArray || !currentValue) return true;
      if (originalArray.length !== currentValue.length) return true;
      return !originalArray.every((id: number) => currentValue.includes(id));
    }
    
    return originalValue !== currentValue;
  };

  const fetchApiData = async () => {
    try {
      setFetchingData(true);
      
      // Fetch professions
      const professionsResponse = await ApiService.getTargetProfessions();
      if (professionsResponse.status === 200) {
        setProfessions(professionsResponse.data);
      }

      // Fetch interests
      const interestsResponse = await ApiService.getInterests();
      if (interestsResponse.status === 200) {
        setInterests(interestsResponse.data);
      }

      // Fetch languages
      const languagesResponse = await ApiService.getLanguages();
      if (languagesResponse.status === 200) {
        setLanguages(languagesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching API data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  // Format date to dd-mm-yyyy
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle date picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  // Toggle interest selection
  const toggleInterest = (interestId: number): void => {
    console.log('[EditProfile] Toggling interest:', interestId);
    if (selectedInterests.includes(interestId)) {
      const newInterests = selectedInterests.filter(id => id !== interestId);
      console.log('[EditProfile] Removing interest, new list:', newInterests);
      setSelectedInterests(newInterests);
    } else {
      const newInterests = [...selectedInterests, interestId];
      console.log('[EditProfile] Adding interest, new list:', newInterests);
      setSelectedInterests(newInterests);
    }
  };

  // Toggle language selection
  const toggleLanguage = (languageId: number): void => {
    if (selectedLanguages.includes(languageId)) {
      setSelectedLanguages(selectedLanguages.filter(id => id !== languageId));
    } else {
      setSelectedLanguages([...selectedLanguages, languageId]);
    }
  };

  // Handle profile image update
  const handleProfileImageUpdate = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const result = await updateProfileImage();
      
      if (result.success && result.imageUrl) {
        // Update user profile with new image
        if (user?.id) {
          const imageUpdateResult = await ApiService.updateUser({
            id: user.id,
            profile_image: result.imageUrl
          } as any);

          if (imageUpdateResult.data?.status === 200) {
            // Update local user data
            updateUserDetails({
              id: user.id,
              profile_image: result.imageUrl
            } as any);
            
            Alert.alert('Success', 'Profile picture updated successfully!');
          } else {
            Alert.alert('Error', 'Failed to save profile picture. Please try again.');
          }
        }
      } else if (result.error) {
        Alert.alert('Upload Failed', result.error);
      }
    } catch (error) {
      console.error('[EditProfile] Profile image update error:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    // Clear previous validation errors
    setValidationErrors([]);
    setFieldErrors({});

    // Comprehensive validation
    const profileData = {
      name: name.trim(),
      email: email.trim(),
      bio: bio.trim(),
      profession,
      gender,
      dateOfBirth: dob ? dob.toISOString() : '',
      mobile_number: user?.mobile_number || ''
    };

    const errors = validateProfile(profileData);

    if (errors.length > 0) {
      setValidationErrors(errors);
      
      // Create field-specific error map
      const fieldErrorMap: Record<string, string> = {};
      errors.forEach(error => {
        fieldErrorMap[error.field] = error.message;
      });
      setFieldErrors(fieldErrorMap);

      // Show validation summary
      Alert.alert(
        'Validation Error',
        formatValidationErrors(errors),
        [{ text: 'OK' }]
      );
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare update data with only changed fields
      const updateData: any = {
        id: user.id,
      };

      // Only include fields that have actually changed
      if (hasFieldChanged('name', name.trim())) {
        updateData.name = name.trim();
      }
      
      if (hasFieldChanged('email', email.trim())) {
        updateData.emailId = email.trim();
      }
      
      if (hasFieldChanged('bio', bio.trim())) {
        updateData.bio = bio.trim();
      }
      
      if (hasFieldChanged('dob', dob)) {
        updateData.dob = dob ? formatDate(dob) : '';
      }
      
      if (hasFieldChanged('gender', gender)) {
        updateData.gender = gender;
      }
      
      if (hasFieldChanged('profession', profession)) {
        updateData.profession = profession;
      }
      
      if (hasFieldChanged('maternalStatus', maternalStatus)) {
        updateData.maternalStatus = maternalStatus;
      }
      
      if (hasFieldChanged('interests', selectedInterests)) {
        updateData.interests = selectedInterests;
        console.log('[EditProfile] Interests changed:', {
          original: originalValues.interests,
          current: selectedInterests,
          sending: updateData.interests
        });
      }

      if (hasFieldChanged('languages', selectedLanguages)) {
        updateData.languages = selectedLanguages;
        console.log('[EditProfile] Languages changed:', {
          original: originalValues.languages,
          current: selectedLanguages,
          sending: updateData.languages
        });
      }

      if (hasFieldChanged('mobileNumber', mobileNumber.trim())) {
        updateData.mobile_number = mobileNumber.trim();
      }

      if (hasFieldChanged('address', address.trim())) {
        updateData.address = address.trim();
      }

      if (hasFieldChanged('pincode', pincode.trim())) {
        updateData.pincode = pincode.trim();
      }

      // Check if any fields were actually changed
      if (Object.keys(updateData).length === 1) { // Only has 'id'
        Alert.alert('Info', 'No changes detected. Please make changes before saving.');
        setLoading(false);
        return;
      }

      console.log('Sending update data (only changed fields):', updateData);

      // Call the update API
      const response = await ApiService.updateUser(updateData);
    
      if (response.data.status === 200) {
        // Update local user context
        await updateUserDetails(updateData);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
      } else {
        Alert.alert('Updated', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time field validation helpers
  const validateField = (fieldName: string, value: string): void => {
    const newFieldErrors = { ...fieldErrors };
    
    switch (fieldName) {
      case 'name':
        const nameValidation = validateProfile({ name: value, email: '', bio: '', profession: '', gender: '', dateOfBirth: '', mobile_number: ''} ).find(e => e.field === 'name');
        if (nameValidation) {
          newFieldErrors.name = nameValidation.message;
        } else {
          delete newFieldErrors.name;
        }
        break;
        
      case 'email':
        if (value.trim()) {
          const emailValidation = validateProfile({ name: '', email: value, bio: '', profession: '', gender: '', dateOfBirth: '', mobile_number: ''} ).find(e => e.field === 'email');
          if (emailValidation) {
            newFieldErrors.email = emailValidation.message;
          } else {
            delete newFieldErrors.email;
          }
        } else {
          delete newFieldErrors.email;
        }
        break;
        
      case 'bio':
        const bioValidation = validateProfile({ name: '', email: '', bio: value, profession: '', gender: '', dateOfBirth: '', mobile_number: ''} ).find(e => e.field === 'bio');
        if (bioValidation) {
          newFieldErrors.bio = bioValidation.message;
        } else {
          delete newFieldErrors.bio;
        }
        break;
    }
    
    setFieldErrors(newFieldErrors);
  };

  if (fetchingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Loading profile data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="check" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: fieldErrors.name ? colors.error : colors.border,
                color: colors.text.primary,
              }
            ]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              validateField('name', text);
            }}
            placeholder="Enter your full name"
            placeholderTextColor={colors.text.light}
            editable={!loading}
          />
          {fieldErrors.name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {fieldErrors.name}
            </Text>
          )}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: fieldErrors.email ? colors.error : colors.border,
                color: colors.text.primary,
              }
            ]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validateField('email', text);
            }}
            placeholder="Enter your email"
            placeholderTextColor={colors.text.light}
            keyboardType="email-address"
            editable={!loading}
          />
          {fieldErrors.email && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {fieldErrors.email}
            </Text>
          )}
        </View>

        {/* About/Bio */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>About</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: fieldErrors.bio ? colors.error : colors.border,
                color: colors.text.primary,
              }
            ]}
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              validateField('bio', text);
            }}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
          {fieldErrors.bio && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {fieldErrors.bio}
            </Text>
          )}
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Date of Birth</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text style={[styles.dateText, { color: dob ? colors.text.primary : colors.text.light }]}>
              {dob ? formatDate(dob) : 'Select your date of birth'}
            </Text>
            <Icon name="calendar" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Gender</Text>
          <View style={styles.genderContainer}>
            {['Male', 'Female', 'Other'].map((genderOption) => (
              <TouchableOpacity
                key={genderOption}
                style={[
                  styles.genderButton,
                  {
                    backgroundColor: gender === genderOption ? colors.primary : colors.surface,
                    borderColor: gender === genderOption ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => !loading && setGender(genderOption)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.genderText,
                    {
                      color: gender === genderOption ? '#ffffff' : colors.text.primary,
                    }
                  ]}
                >
                  {genderOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profession */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Profession</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdownInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setShowProfessionModal(true)}
            disabled={loading}
          >
            <Text style={[styles.dropdownText, { color: profession ? colors.text.primary : colors.text.light }]}>
              {profession || 'Select your profession'}
            </Text>
            <Icon name="chevron-down" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Marital Status */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Marital Status</Text>
          <View style={styles.maritalStatusContainer}>
            {['Single', 'Married'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.maritalStatusButton,
                  {
                    backgroundColor: maternalStatus === status ? colors.primary : colors.surface,
                    borderColor: maternalStatus === status ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => !loading && setMaternalStatus(status)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.maritalStatusText,
                    {
                      color: maternalStatus === status ? '#ffffff' : colors.text.primary,
                    }
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.inputGroup}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Interests</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Select topics you're interested in
          </Text>
          <View style={styles.interestsContainer}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestButton,
                  {
                    backgroundColor: selectedInterests.includes(interest.id) ? colors.primary : colors.surface,
                    borderColor: selectedInterests.includes(interest.id) ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => !loading && toggleInterest(interest.id)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.interestText,
                    {
                      color: selectedInterests.includes(interest.id) ? '#ffffff' : colors.text.primary,
                    }
                  ]}
                >
                  {interest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mother Tongue */}
        <View style={styles.inputGroup}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Mother Tongue</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Select your native languages
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdownInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setShowLanguageModal(true)}
            disabled={loading}
          >
            <Text style={[styles.dropdownText, { color: selectedLanguages.length > 0 ? colors.text.primary : colors.text.light }]}>
              {selectedLanguages.length > 0 
                ? `${selectedLanguages.length} language(s) selected`
                : 'Select your mother tongue'
              }
            </Text>
            <Icon name="chevron-down" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Mobile Number */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Mobile Number</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="Enter your mobile number"
            placeholderTextColor={colors.text.light}
            keyboardType="phone-pad"
            maxLength={15}
            editable={!loading}
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Address</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your complete address"
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        {/* Pincode */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Pincode</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={pincode}
            onChangeText={setPincode}
            placeholder="Enter your area pincode"
            placeholderTextColor={colors.text.light}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* Profession Selection Modal */}
      <Modal
        visible={showProfessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Profession</Text>
              <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
                <Icon name="x" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={professions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor: profession === item.name ? colors.primary : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    setProfession(item.name);
                    setShowProfessionModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color: profession === item.name ? '#ffffff' : colors.text.primary,
                      }
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Mother Tongue</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Icon name="x" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor: selectedLanguages.includes(item.id) ? colors.primary : 'transparent',
                    }
                  ]}
                  onPress={() => toggleLanguage(item.id)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color: selectedLanguages.includes(item.id) ? '#ffffff' : colors.text.primary,
                      }
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedLanguages.includes(item.id) && (
                    <Icon name="check" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              )}
            />
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  maritalStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  maritalStatusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  maritalStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default EditProfile;