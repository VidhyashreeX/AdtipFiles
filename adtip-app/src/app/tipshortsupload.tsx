import {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {router, useRouter} from 'expo-router';
import {Camera, Image as ImageIcon, X} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function TipShortsUploadScreen() {
  const router = useRouter();
  const [isEarningEnabled, setIsEarningEnabled] = useState(false);
  const [hasToggled, setHasToggled] = useState(false); // Track if toggle has occurred

  const handleCameraPress = async () => {
    // Request camera permissions
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need permission to access your camera to record a video.',
      );
      return;
    }

    // Open the camera to record a video
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Restrict to videos only
      allowsEditing: true, // Allow trimming/editing the video
      quality: 1, // Highest quality
    });

    if (!result.canceled) {
      const videoUri = result.assets[0].uri;
      console.log('Recorded video URI:', videoUri);
      // You can use the videoUri for further processing, e.g., uploading
    } else {
      console.log('Camera recording canceled');
    }
  };

  const handleGalleryPress = async () => {
    // Request media library permissions
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need permission to access your media library to pick a video.',
      );
      return;
    }

    // Open the gallery to pick a video
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Restrict to videos only
      allowsEditing: true, // Allow trimming/editing the video
      quality: 1, // Highest quality
    });

    if (!result.canceled) {
      const videoUri = result.assets[0].uri;
      console.log('Selected video URI:', videoUri);
      // You can use the videoUri for further processing, e.g., uploading
    } else {
      console.log('Video selection canceled');
    }
  };

  const handleUploadPress = () => {
    console.log('Uploading TipShort video');
  };

  const handleEarningToggle = () => {
    if (!isEarningEnabled && !hasToggled) {
      // Navigate to packages screen only on first toggle
      router.push('/packages');
      setHasToggled(true); // Mark as toggled to prevent further redirects
    }
    setIsEarningEnabled(!isEarningEnabled);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload TipShort Video</Text>
      </View>

      <View style={styles.videoPreview}>
        <Text style={styles.previewText}>Select TipShort Video</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCameraPress}>
        <Camera size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Open Camera & Record</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.galleryButton]}
        onPress={handleGalleryPress}>
        <ImageIcon size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Pick Video from Gallery</Text>
      </TouchableOpacity>

      <View style={styles.earningContainer}>
        <Text style={styles.earningText}>Do you want to earn money?</Text>
        <Switch
          value={isEarningEnabled}
          onValueChange={handleEarningToggle}
          trackColor={{false: '#767577', true: '#24d05a'}}
          thumbColor={isEarningEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
        <Text style={styles.uploadButtonText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48, // Move content down by 1 inch (96 pixels)
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
  videoPreview: {
    backgroundColor: '#e6e1ff',
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewText: {
    fontSize: 16,
    color: '#6b48ff',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b48ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  galleryButton: {
    backgroundColor: '#1e3a8a',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  earningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  earningText: {
    fontSize: 16,
    color: '#1f2937',
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
});
