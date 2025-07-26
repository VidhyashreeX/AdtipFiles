import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { Camera, Save, X } from 'lucide-react-native';
import Header from '../../components/common/Header';
import ApiService from '../../services/ApiService';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import { UpdateChannelRequest } from '../../types/api';
import { useUpdateChannel } from '../../hooks/useQueries';

type RootStackParamList = {
  EditChannel: { channelId: string };
};

type EditChannelScreenRouteProp = RouteProp<RootStackParamList, 'EditChannel'>;

interface ChannelData {
  channelId: string;
  channelName: string;
  description: string;
  profileImage?: string;
  coverImage?: string;
}

const EditChannelScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditChannelScreenRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Get channelId from route params with error handling
  const channelId = route.params?.channelId;

  // If no channelId is provided, redirect back
  React.useEffect(() => {
    if (!channelId) {
      console.error('[EditChannelScreen] No channelId provided in route params');
      Alert.alert(
        'Error',
        'No channel ID provided. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [channelId, navigation]);

  // React Query mutation for updating channel
  const updateChannelMutation = useUpdateChannel();
  
  // State management
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  // Load channel data
  useEffect(() => {
    loadChannelData();
  }, [channelId]);

  const loadChannelData = async () => {
    if (!channelId) {
      console.error('[EditChannelScreen] Cannot load channel data: channelId is undefined');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await ApiService.getChannelByUserId(Number(channelId));
      
      if (response.data && response.data.length > 0) {
        const channelData = response.data[0];
        const channel: ChannelData = {
          channelId: channelData.channelId || channelId,
          channelName: channelData.channelName || '',
          description: channelData.description || '',
          profileImage: channelData.profileImage,
          coverImage: channelData.coverImage,
        };
        
        setChannel(channel);
        setChannelName(channel.channelName);
        setDescription(channel.description);
        setProfileImage(channel.profileImage);
        setCoverImage(channel.coverImage);
      }
    } catch (error) {
      console.error('Error loading channel data:', error);
      Alert.alert('Error', 'Failed to load channel data');
    } finally {
      setIsLoading(false);
    }
  };

  // Validation
  const validateForm = () => {
    let isValid = true;
    
    setNameError('');
    setDescriptionError('');
    
    if (!channelName.trim()) {
      setNameError('Channel name is required');
      isValid = false;
    } else if (channelName.trim().length < 3) {
      setNameError('Channel name must be at least 3 characters');
      isValid = false;
    }
    
    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else if (description.trim().length < 10) {
      setDescriptionError('Description must be at least 10 characters');
      isValid = false;
    }
    
    return isValid;
  };

  // Handle image upload
  const handleImageUpload = async (type: 'profile' | 'cover') => {
    try {
      setUploadingImage(true);

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: type === 'profile' ? 500 : 1200,
        maxHeight: type === 'profile' ? 500 : 600,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedImage = result.assets[0];
      if (!selectedImage.uri) return;

      // Upload to Cloudflare
      const uploadResult = await CloudflareUploadService.uploadFile(
        selectedImage.uri,
        'images',
        `${type}_${Date.now()}.jpg`,
        Number(user?.id)
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Update local state
      if (type === 'profile') {
        setProfileImage(uploadResult.url);
      } else {
        setCoverImage(uploadResult.url);
      }

      Alert.alert('Success', `${type === 'profile' ? 'Profile' : 'Cover'} image updated`);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm() || !channel || !user || !channelId) {
      console.error('[EditChannelScreen] Cannot save: missing required data', {
        hasChannel: !!channel,
        hasUser: !!user,
        hasChannelId: !!channelId
      });
      return;
    }

    try {
      setIsSaving(true);

      const updateData: UpdateChannelRequest = {
        id: Number(channel.channelId),
        channelName: channelName.trim(),
        channelDescription: description.trim(),
        profileImageURL: profileImage || '',
      };

      console.log('🔄 [EditChannelScreen] Updating channel with data:', updateData);

      // Use the React Query mutation which will automatically invalidate and refetch channel data
      await updateChannelMutation.mutateAsync(updateData);

      console.log('✅ [EditChannelScreen] Channel updated successfully, queries invalidated');
      Alert.alert('Success', 'Channel updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error('❌ [EditChannelScreen] Error updating channel:', error);
      Alert.alert('Error', 'Failed to update channel');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Edit Channel"
          showSearch={false}
          showWallet={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Standardized Header */}
      <Header
        title="Edit Channel"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButtonHeader}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Save size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity 
          style={styles.coverContainer}
          onPress={() => handleImageUpload('cover')}
          disabled={uploadingImage}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.surface }]}>
              <Camera size={32} color={colors.textSecondary} />
              <Text style={[styles.coverPlaceholderText, { color: colors.textSecondary }]}>
                Add Cover Image
              </Text>
            </View>
          )}
          <View style={[styles.coverEditOverlay, { backgroundColor: colors.primary }]}>
            <Camera size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Profile Image */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileContainer}
            onPress={() => handleImageUpload('profile')}
            disabled={uploadingImage}
          >
            <Image
              source={{
                uri: profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${user?.id}`,
              }}
              style={styles.profileImage}
            />
            <View style={[styles.profileEditOverlay, { backgroundColor: colors.primary }]}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Channel Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Channel Name *</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: nameError ? '#FF4444' : colors.border,
                }
              ]}
              value={channelName}
              onChangeText={(text) => {
                setChannelName(text);
                if (nameError) setNameError('');
              }}
              placeholder="Enter channel name"
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
            />
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Description *</Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: descriptionError ? '#FF4444' : colors.border,
                }
              ]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (descriptionError) setDescriptionError('');
              }}
              placeholder="Describe your channel"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {descriptionError ? (
              <Text style={styles.errorText}>{descriptionError}</Text>
            ) : null}
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {description.length}/500
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  saveButtonHeader: {
    padding: 8,
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
  content: {
    flex: 1,
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  coverEditOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditChannelScreen;
