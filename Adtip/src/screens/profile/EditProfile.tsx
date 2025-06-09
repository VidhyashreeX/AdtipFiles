import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

interface EditProfileProps {
  initialName?: string;
  initialEmail?: string;
}

const EditProfile: React.FC<EditProfileProps> = ({
  initialName = "indraja",
  initialEmail = "indrajathunguntla@gmail.com",
}) => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState<string>(initialName);
  const [email, setEmail] = useState<string>(initialEmail);
  const [about, setAbout] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [profession, setProfession] = useState<string>("");
  const [maritalStatus, setMaritalStatus] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([
    "Prepare for gov job", "Look for jobs", "Prepare for neet", "Prepare for upsc",
    "To learn English", "To learn Hindi", "To learn software", "To learn AI",
    "To prepare for CA", "Doctor", "Prepare for jobs", "To learn stock market",
  ]);

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

  const toggleInterest = (interest: string): void => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(item => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSave = (): void => {
    // Simulate saving data
    Alert.alert('Success', 'Profile updated successfully');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.headerButtonSave}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Name */}
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor="#999"
        />

        {/* Email */}
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
        />

        {/* About */}
        <TextInput
          style={[styles.input, styles.textArea]}
          value={about}
          onChangeText={setAbout}
          placeholder="About"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        {/* Age */}
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Age"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />

        {/* Gender */}
        <TextInput
          style={styles.input}
          value={gender}
          onChangeText={setGender}
          placeholder="Gender"
          placeholderTextColor="#999"
        />

        {/* Profession */}
        <TextInput
          style={styles.input}
          value={profession}
          onChangeText={setProfession}
          placeholder="Profession"
          placeholderTextColor="#999"
        />

        {/* Marital Status */}
        <TextInput
          style={styles.input}
          value={maritalStatus}
          onChangeText={setMaritalStatus}
          placeholder="Marital Status"
          placeholderTextColor="#999"
        />

        {/* Interests */}
        <View>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {allInterests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestButton,
                  interests.includes(interest) && styles.interestButtonSelected,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestText,
                    interests.includes(interest) && styles.interestTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    fontSize: 24,
    color: '#4080FF',
  },
  headerButtonSave: {
    fontSize: 24,
    color: '#00C853',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    padding: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  interestButtonSelected: {
    backgroundColor: '#E0F7FA',
    borderColor: '#80DEEA',
  },
  interestText: {
    fontSize: 14,
    color: '#333',
  },
  interestTextSelected: {
    color: '#006064',
  },
});

export default EditProfile;