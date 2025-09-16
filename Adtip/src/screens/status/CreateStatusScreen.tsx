// src/screens/status/CreateStatusScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X, Camera, Image as ImageIcon, Type } from 'lucide-react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';

const { width: screenWidth } = Dimensions.get('window');

interface CreateStatusScreenProps {}

const CreateStatusScreen: React.FC<CreateStatusScreenProps> = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(colors);

  const [statusType, setStatusType] = useState<'text' | 'image' | 'video'>('text');
  const [statusText, setStatusText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSelectMedia = useCallback((type: 'camera' | 'gallery') => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1,
      videoQuality: 'medium' as 'low' | 'medium' | 'high',
      durationLimit: 60, // 60 seconds max for videos
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to select media');
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        console.log('Selected media asset:', asset);
        setSelectedMedia(asset.uri || null);
        if (asset.type?.startsWith('image')) {
          setStatusType('image');
        } else if (asset.type?.startsWith('video')) {
          setStatusType('video');
        } else {
          // Fallback - check file extension
          const fileName = asset.fileName || asset.uri || '';
          if (fileName.match(/\.(mp4|mov|avi|mkv)$/i)) {
            setStatusType('video');
          } else {
            setStatusType('image');
          }
        }
      }
    });
  }, []);

  const handleCreateStatus = useCallback(async () => {
    if (!statusText.trim() && !selectedMedia) {
      Alert.alert('Error', 'Please add text or media to create a status');
      return;
    }

    setIsUploading(true);

    try {
      let media = undefined;
      if (selectedMedia) {
        // Extract file name and type from uri
        const uriParts = selectedMedia.split('/');
        let name = uriParts[uriParts.length - 1];
        
        // Ensure proper file extension
        if (statusType === 'video' && !name.match(/\.(mp4|mov|avi|mkv)$/i)) {
          name += '.mp4';
        } else if (statusType === 'image' && !name.match(/\.(jpg|jpeg|png|gif)$/i)) {
          name += '.jpg';
        }
        
        const type = statusType === 'image' ? 'image/jpeg' : 'video/mp4';
        media = { uri: selectedMedia, type, name };
        console.log('Prepared media for upload:', media);
      }
      const response = await ApiService.uploadStatus({
        content: statusText,
        content_type: statusType,
        created_by: Number(user?.id ?? 0),
        media,
      });
      if (response.status === 200) {
        if (response.warning) {
          // Show warning if media upload failed but text was saved
          Alert.alert('Partial Success', response.warning + '\n\nWould you like to try uploading just the text?', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert('Success', 'Status created successfully', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to create status');
      }
    } catch (error: any) {
      console.error('Error creating status:', error);
      let errorMessage = 'Failed to create status. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (error.response?.status === 413) {
        errorMessage = 'File too large. Please choose a smaller file.';
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please choose a valid image or video file.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [statusText, selectedMedia, statusType, user, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={typeof colors.text === 'string' ? colors.text : '#222'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Status</Text>
        <TouchableOpacity
          onPress={handleCreateStatus}
          style={[styles.shareButton, (!statusText.trim() && !selectedMedia) && styles.shareButtonDisabled]}
          disabled={(!statusText.trim() && !selectedMedia) || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.shareButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(user?.name || user?.firstName || 'U').charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || user?.firstName || 'Your Story'}</Text>
        </View>

        {/* Status Input */}
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textSecondary}
          multiline
          value={statusText}
          onChangeText={setStatusText}
          maxLength={500}
        />

        {/* Selected Media Preview */}
        {selectedMedia && (
          <View style={styles.mediaPreview}>
            {statusType === 'image' ? (
              <Image source={{ uri: selectedMedia }} style={styles.previewImage} />
            ) : (
              <View style={styles.videoPreview}>
                <Text style={styles.videoPreviewText}>Video selected</Text>
                {/* You can use a video player here, e.g. react-native-video, for preview */}
              </View>
            )}
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={() => setSelectedMedia(null)}
            >
              <X size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Media Options */}
        <View style={styles.mediaOptions}>
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={() => handleSelectMedia('gallery')}
          >
            <ImageIcon size={24} color={colors.primary} />
            <Text style={styles.mediaOptionText}>Photo/Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={() => {
              setStatusType('text');
              setSelectedMedia(null);
            }}
          >
            <Type size={24} color={colors.primary} />
            <Text style={styles.mediaOptionText}>Text Only</Text>
          </TouchableOpacity>
        </View>

        {/* Character Count */}
        <Text style={styles.charCount}>{statusText.length}/500</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  shareButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  shareButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  textInput: {
    fontSize: 18,
    color: colors.text,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mediaOption: {
    alignItems: 'center',
    padding: 16,
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
  },
  videoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
  },
  videoPreviewText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
});

export default CreateStatusScreen;