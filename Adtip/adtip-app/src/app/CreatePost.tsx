import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Globe } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// Define an enum for media types
enum MediaType {
  Image = 'image',
  Video = 'video',
}

export default function CreatePostScreen() {
  const [caption, setCaption] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: MediaType | null } | null>(null);
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    router.back();
  };

  const handleNext = () => {
    if (!selectedMedia || !caption.trim()) {
      Alert.alert('Error', 'Please select an image or video and add a caption before proceeding.');
      return;
    }
    router.push({
      pathname: '/SelectCategoryScreen',
      params: { caption, selectedMedia: JSON.stringify(selectedMedia) },
    });
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Sorry, we need media library permissions to access your photos and videos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      Alert.alert('Error', 'Failed to request media library permission. Please try again.');
      return false;
    }
  };

  const handleUploadImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable cropping
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia({ uri: result.assets[0].uri, type: MediaType.Image });
        console.log('Image selected:', result.assets[0].uri);
      } else {
        console.log('Image selection canceled');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUploadVideo = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia({ uri: result.assets[0].uri, type: MediaType.Video });
        console.log('Video selected:', result.assets[0].uri);
      } else {
        console.log('Video selection canceled');
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const screenHeight = Dimensions.get('window').height;
  const headerHeight = 12 + 24 + 16;
  const footerHeight = 12 + 14 + 16 + 8;
  const availableHeight = screenHeight - headerHeight - footerHeight - insets.top - insets.bottom;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.nextButton}>Next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.username}>Chandana</Text>
        <View style={styles.visibility}>
          <Globe size={16} color="#666" style={styles.icon} />
          <Text style={styles.visibilityText}>Public</Text>
        </View>
      </View>

      <TextInput
        style={styles.captionInput}
        placeholder="Give a caption to your post"
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {selectedMedia && (
        <View style={styles.mediaPreview}>
          {selectedMedia.type === MediaType.Image ? (
            <Image
              source={{ uri: selectedMedia.uri }}
              style={[styles.previewImage, { height: availableHeight * 0.6 }]}
            />
          ) : (
            <Text style={styles.previewText}>Video selected (preview not available)</Text>
          )}
        </View>
      )}

      <View style={styles.uploadContainer}>
        <Text style={styles.uploadText}>
          Browse and Drag the files you want to upload from your device
        </Text>
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadImage}>
            <Text style={styles.uploadButtonText}>+ Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadVideo}>
            <Text style={styles.uploadButtonText}>+ Upload Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f9ff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    marginTop: 16, // Added to move header down by ~1 inch
  },
  closeButton: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  nextButton: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#24d05a',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  visibility: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  visibilityText: {
    fontSize: 14,
    color: '#666',
  },
  captionInput: {
    fontSize: 16,
    color: '#374151',
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 32,
  },
  mediaPreview: {
    marginBottom: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  previewText: {
    fontSize: 14,
    color: '#666',
  },
  uploadContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#24d05a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});