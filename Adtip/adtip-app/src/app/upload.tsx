import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Upload, Image as ImageIcon, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { categories } from '@/utils/dummyData';
import { useUserStore } from '@/store/userStore';

export default function UploadScreen() {
  const router = useRouter();
  const { channel } = useUserStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  const goBack = () => {
    router.back();
  };
  
  const clearThumbnail = () => {
    setThumbnailUrl('');
  };
  
  const handleUpload = () => {
    // In a real app, this would upload the video
    router.push('/channel/me');
  };

  if (!channel) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text>You need to create a channel first</Text>
        <TouchableOpacity 
          onPress={() => router.push('/channel/create')}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Create Channel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={styles.placeholder} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.formContainer}>
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.uploadButton}>
              <Upload size={32} color="#FF0000" />
              <Text style={styles.uploadText}>Tap to select a video</Text>
              <Text style={styles.uploadSubtext}>MP4, MOV, or WebM format (max 100MB)</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Add a title that describes your video"
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell viewers about your video"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text 
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.selectedCategoryText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Thumbnail</Text>
            {thumbnailUrl ? (
              <View style={styles.thumbnailContainer}>
                <Image 
                  source={{ uri: thumbnailUrl }} 
                  style={styles.thumbnailImage} 
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.clearThumbnailButton}
                  onPress={clearThumbnail}
                >
                  <X size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.thumbnailButton}
                onPress={() => setThumbnailUrl('https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg')}
              >
                <ImageIcon size={24} color="#666" />
                <Text style={styles.thumbnailText}>Upload Thumbnail</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.thumbnailHint}>
              Select or upload an image that shows what's in your video
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.publishButton,
              (!title || !description || !selectedCategory) && styles.disabledButton,
            ]}
            onPress={handleUpload}
            disabled={!title || !description || !selectedCategory}
          >
            <Text style={styles.publishButtonText}>Upload Video</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  uploadSection: {
    marginVertical: 16,
  },
  uploadButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryContainer: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  selectedCategory: {
    backgroundColor: '#FF0000',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#FFF',
    fontWeight: '500',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  clearThumbnailButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 4,
  },
  thumbnailButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 8,
  },
  thumbnailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  thumbnailHint: {
    fontSize: 12,
    color: '#666',
  },
  publishButton: {
    backgroundColor: '#24d05a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#24d05a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});