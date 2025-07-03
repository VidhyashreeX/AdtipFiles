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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Import API service
import ApiService from '../../services/ApiService';

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

const EditProfile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUserDetails } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Form state - initialized with user data
  const [firstName, setFirstName] = useState<string>(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState<string>(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState<string>(user?.emailId || '');
  const [about, setAbout] = useState<string>(user?.bio || '');
  const [address, setAddress] = useState<string>(user?.address || '');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>(user?.gender || '');
  const [profession, setProfession] = useState<string>(user?.profession || '');
  const [maritalStatus, setMaritalStatus] = useState<string>(user?.maternal_status || '');
  const [interests, setInterests] = useState<string[]>(
    user?.interests?.map((interest: any) => interest.name || interest) || []
  );

  // Calculate age from date of birth
  useEffect(() => {
    if (user?.dob) {
      const birthDate = new Date(user.dob);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setAge((calculatedAge - 1).toString());
      } else {
        setAge(calculatedAge.toString());
      }
    }
  }, [user?.dob]);

  const allInterests: string[] = [
    "Prepare for gov job", "Look for jobs", "Prepare for neet", "Prepare for upsc",
    "To learn English", "To learn Hindi", "To learn software", "To learn AI",
    "To prepare for CA", "Doctor", "Prepare for jobs", "To learn stock market",
    "To learn something new", "To learn save environment", "To learn marketing",
    "Fashion design", "Writer", "Law", "Marketing", "Sports", "Science and Technology",
    "History and Archaeology", "Health and Fitness", "Medicine and Healthcare",
    "Cooking and Culinary Arts", "Literature and Books", "Philosophy and Ethics",
    "Movies and Entertainment", "Spirituality and Religion", "Psychology and Behavior",
    "Business and Startups", "Music and Arts", "Travel and Adventure",
  ];

  // Toggle interest selection
  const toggleInterest = (interest: string): void => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(item => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  // Save profile data to local storage
  const saveProfileToLocalStorage = async (profileData: any): Promise<void> => {
    try {
      const userId = String(user?.id);
      if (!userId) return;
      
      // Save each profile field separately
      await AsyncStorage.setItem(`profile_firstName_${userId}`, profileData.firstname || '');
      await AsyncStorage.setItem(`profile_lastName_${userId}`, profileData.lastname || '');
      await AsyncStorage.setItem(`profile_name_${userId}`, profileData.name || '');
      await AsyncStorage.setItem(`profile_email_${userId}`, profileData.emailId || '');
      await AsyncStorage.setItem(`profile_address_${userId}`, profileData.address || '');
      await AsyncStorage.setItem(`profile_bio_${userId}`, about || ''); // Save bio which is not in updateData
      await AsyncStorage.setItem(`profile_gender_${userId}`, profileData.gender || '');
      await AsyncStorage.setItem(`profile_profession_${userId}`, profileData.profession || '');
      await AsyncStorage.setItem(`profile_maritalStatus_${userId}`, profileData.maternal_status || '');
      await AsyncStorage.setItem(`profile_age_${userId}`, age || '');
      
      // Save interests as JSON string
      await AsyncStorage.setItem(`profile_interests_${userId}`, JSON.stringify(interests));
      
      console.log('Profile data saved to local storage');
    } catch (error) {
      console.error('Error saving profile data to local storage:', error);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    // Validate age if it's provided
    if (age && (parseInt(age) < 0 || parseInt(age) > 120)) {
      Alert.alert('Error', 'Age must be between 0 and 120');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare update data in the exact format required by the API
      const updateData = {
        id: user.id,
        name: `${firstName} ${lastName}`.trim(), // Concatenate first and last name
        firstname: firstName,
        lastname: lastName,
        gender: gender,
        dob: user.dob || "1990-01-01", // Keep existing DOB or default
        profile_image: user.profile_image || "",
        profession: profession,
        maternal_status: maritalStatus,
        address: address,
        emailId: email,
        longitude: user.longitude || "",
        latitude: user.latitude || "",
        pincode: user.pincode || "",
        languages: 1, // Default language ID, can be made configurable
        interests: 3, // Default interest ID, can be made configurable  
        referal_code: "" // Always send empty string to avoid self-referral error
      };

      // Call the update API with proper type casting
      await updateUserDetails(updateData as any);
      
      // Save profile data to local storage
      await saveProfileToLocalStorage(updateData);
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>First Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            placeholderTextColor={colors.text.light}
            editable={!loading}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Last Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            placeholderTextColor={colors.text.light}
            editable={!loading}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.text.light}
            keyboardType="email-address"
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
            placeholder="Enter your address"
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={2}
            editable={!loading}
          />
        </View>

        {/* About */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>About</Text>
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
            value={about}
            onChangeText={setAbout}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Age</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={age}
            onChangeText={(text) => {
              // Allow only numbers and validate range 0-120
              const numericValue = text.replace(/[^0-9]/g, '');
              if (numericValue === '' || (parseInt(numericValue, 10) >= 0 && parseInt(numericValue, 10) <= 120)) {
                setAge(numericValue);
              }
            }}
            placeholder="Enter your age (0-120)"
            placeholderTextColor={colors.text.light}
            keyboardType="numeric"
            editable={!loading}
            maxLength={3} // Limit input to 3 digits
          />
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
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text.primary,
              }
            ]}
            value={profession}
            onChangeText={setProfession}
            placeholder="Enter your profession"
            placeholderTextColor={colors.text.light}
            editable={!loading}
          />
        </View>

        {/* Marital Status */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Marital Status</Text>
          <View style={styles.maritalStatusContainer}>
            {['Single', 'Married', 'Divorced', 'Widowed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.maritalStatusButton,
                  {
                    backgroundColor: maritalStatus === status ? colors.primary : colors.surface,
                    borderColor: maritalStatus === status ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => !loading && setMaritalStatus(status)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.maritalStatusText,
                    {
                      color: maritalStatus === status ? '#ffffff' : colors.text.primary,
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
            {allInterests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestButton,
                  {
                    backgroundColor: interests.includes(interest) ? colors.primary : colors.surface,
                    borderColor: interests.includes(interest) ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => !loading && toggleInterest(interest)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.interestText,
                    {
                      color: interests.includes(interest) ? '#ffffff' : colors.text.primary,
                    }
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
});

export default EditProfile;