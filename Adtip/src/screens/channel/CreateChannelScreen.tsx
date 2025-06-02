// src/screens/channel/CreateChannelScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface ChannelForm {
  name: string;
  username: string;
  description: string;
  category: string;
  avatarUri?: string;
  bannerUri?: string;
}

const CreateChannelScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ChannelForm>({
    name: '',
    username: '',
    description: '',
    category: '',
  });

  const categories = [
    'Technology',
    'Education',
    'Entertainment',
    'Gaming',
    'Music',
    'Sports',
    'News',
    'Lifestyle',
    'Travel',
    'Food',
    'Health',
    'Business',
  ];

  const updateForm = (field: keyof ChannelForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = (type: 'avatar' | 'banner') => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: type === 'banner' ? 400 : 300,
      maxWidth: type === 'banner' ? 800 : 300,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (type === 'avatar') {
          setForm(prev => ({ ...prev, avatarUri: imageUri }));
        } else {
          setForm(prev => ({ ...prev, bannerUri: imageUri }));
        }
      }
    });
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Channel name is required');
      return false;
    }
    if (!form.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (!form.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    if (!form.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    return true;
  };

  const handleCreateChannel = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Mock API call - replace with actual channel creation logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Channel created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating channel:', error);
      Alert.alert('Error', 'Failed to create channel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Create Channel" showBackButton />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner Upload */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Channel Banner
          </Text>
          <TouchableOpacity
            style={[styles.bannerUpload, { borderColor: colors.border.light }]}
            onPress={() => pickImage('banner')}
          >
            {form.bannerUri ? (
              <Image source={{ uri: form.bannerUri }} style={styles.bannerPreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Icon name="camera" size={32} color={colors.text.secondary} />
                <Text style={[styles.uploadText, { color: colors.text.secondary }]}>
                  Upload Banner
                </Text>
                <Text style={[styles.uploadSubtext, { color: colors.text.tertiary }]}>
                  Recommended: 800x400px
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar Upload */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Channel Avatar
          </Text>
          <TouchableOpacity
            style={[styles.avatarUpload, { borderColor: colors.border.light }]}
            onPress={() => pickImage('avatar')}
          >
            {form.avatarUri ? (
              <Image source={{ uri: form.avatarUri }} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="user" size={32} color={colors.text.secondary} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.helpText, { color: colors.text.tertiary }]}>
            Recommended: 300x300px
          </Text>
        </View>

        {/* Channel Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Channel Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border.light,
                color: colors.text.primary,
              }
            ]}
            placeholder="Enter channel name"
            placeholderTextColor={colors.text.tertiary}
            value={form.name}
            onChangeText={(text) => updateForm('name', text)}
            maxLength={50}
          />
          <Text style={[styles.charCount, { color: colors.text.tertiary }]}>
            {form.name.length}/50
          </Text>
        </View>

        {/* Username */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Username *
          </Text>
          <View style={[
            styles.usernameContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border.light,
            }
          ]}>
            <Text style={[styles.usernamePrefix, { color: colors.text.secondary }]}>@</Text>
            <TextInput
              style={[styles.usernameInput, { color: colors.text.primary }]}
              placeholder="username"
              placeholderTextColor={colors.text.tertiary}
              value={form.username}
              onChangeText={(text) => updateForm('username', text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={30}
              autoCapitalize="none"
            />
          </View>
          <Text style={[styles.helpText, { color: colors.text.tertiary }]}>
            Only lowercase letters, numbers, and underscores allowed
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Description *
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border.light,
                color: colors.text.primary,
              }
            ]}
            placeholder="Describe your channel..."
            placeholderTextColor={colors.text.tertiary}
            value={form.description}
            onChangeText={(text) => updateForm('description', text)}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: colors.text.tertiary }]}>
            {form.description.length}/200
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Category *
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: form.category === category ? colors.primary : colors.surface,
                    borderColor: form.category === category ? colors.primary : colors.border.light,
                  }
                ]}
                onPress={() => updateForm('category', category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: form.category === category ? colors.white : colors.text.primary,
                    }
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1,
            }
          ]}
          onPress={handleCreateChannel}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[styles.createButtonText, { color: colors.white }]}>
              Create Channel
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  usernamePrefix: {
    fontSize: 16,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
  },
  bannerUpload: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  avatarUpload: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 50,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateChannelScreen;
