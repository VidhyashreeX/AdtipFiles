import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {Video, ResizeMode} from 'expo-av';
import {X} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://3.6.15.198:7082';

export default function VideoPreviewScreen() {
  const router = useRouter();
  const {videoUri} = useLocalSearchParams<{videoUri: string}>();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'No video available to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Login Required', 'Please log in to upload videos.', [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Login', onPress: () => router.push('/login')},
        ]);
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        name: 'video.mp4',
        type: 'video/mp4',
      } as any);

      const response = await fetch(`${API_URL}/api/upload-video`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Login Required', 'Please log in to upload videos.', [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Login', onPress: () => router.push('/login')},
          ]);
          return;
        }
        throw new Error(`Upload failed! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      Alert.alert('Success', 'Video uploaded successfully!');
      router.push('/home');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload the video. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Preview</Text>
      </View>

      {videoUri ? (
        <Video
          source={{uri: videoUri}}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
      ) : (
        <Text style={styles.errorText}>No video available</Text>
      )}

      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.disabledButton]}
        onPress={handleUpload}
        disabled={isUploading}>
        <Text style={styles.uploadButtonText}>
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b48ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
  },
  video: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
});
