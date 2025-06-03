// src/screens/content/CreatePostScreen.tsx
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../types/navigation';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-crop-picker';

// Custom components
import Header from '../../components/common/Header';
import CategoryChip from '../../components/common/CategoryChip';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import {ENDPOINTS} from '../../constants/api';

const CreatePostScreen = () => {
  const {colors} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Focus input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Handle image picking
  const handlePickImage = () => {
    ImagePicker.openPicker({
      width: 1200,
      height: 1200,
      multiple: true,
      cropping: false,
      compressImageQuality: 0.8,
      mediaType: 'photo',
      maxFiles: 5 - images.length,
    })
      .then(selectedImages => {
        // Limit to 5 images total
        if (images.length + selectedImages.length > 5) {
          Alert.alert('Limit Exceeded', 'You can upload maximum 5 images');
          return;
        }

        const newImages = selectedImages.map(img => ({
          uri: Platform.OS === 'ios' ? img.sourceURL || img.path : img.path,
          type: img.mime,
          name: img.path.split('/').pop(),
          width: img.width,
          height: img.height,
        }));

        setImages([...images, ...newImages]);
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Error', 'Failed to pick image');
          console.error(err);
        }
      });
  };

  // Handle take photo
  const handleTakePhoto = () => {
    ImagePicker.openCamera({
      width: 1200,
      height: 1200,
      cropping: false,
      compressImageQuality: 0.8,
    })
      .then(image => {
        if (images.length >= 5) {
          Alert.alert('Limit Exceeded', 'You can upload maximum 5 images');
          return;
        }

        const newImage = {
          uri:
            Platform.OS === 'ios' ? image.sourceURL || image.path : image.path,
          type: image.mime,
          name: image.path.split('/').pop(),
          width: image.width,
          height: image.height,
        };

        setImages([...images, newImage]);
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Error', 'Failed to take photo');
          console.error(err);
        }
      });
  };

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  // Handle select category
  const handleSelectCategory = () => {
    // @ts-ignore
    navigation.navigate('SelectCategory', {
      onSelect: (category: any) => setSelectedCategory(category),
      selectedCategory,
    });
  };

  // Handle publish post
  const handlePublish = async () => {
    // Validate content
    if (!content.trim() && images.length === 0) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    try {
      setIsLoading(true);

      // Create form data
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isPublic', isPublic ? '1' : '0');

      if (selectedCategory) {
        formData.append('categoryId', selectedCategory.id);
      }

      // Add images
      images.forEach((img, index) => {
        formData.append(`images[${index}]`, {
          uri: img.uri,
          type: img.type,
          name: img.name,
        } as any);
      });

      // Upload post
      await ApiService.uploadFile(
        ENDPOINTS.CREATE_POST,
        formData,
        progress => {
          console.log('Upload progress:', progress);
        },
      );

      setIsLoading(false);

      // Show success message
      Alert.alert('Success', 'Your post has been published!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to publish your post. Please try again.');
      console.error('Error publishing post:', error);
    }
  };

  const isDisabled = isLoading || (!content.trim() && images.length === 0);
  const publishOpacity = isDisabled ? 0.5 : 1;

  return (
    <SafeAreaView style={[{backgroundColor: colors.background}, styles.container]}>
      <Header
        title="Create Post"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity
            onPress={handlePublish}
            disabled={isDisabled}
            style={{ opacity: publishOpacity }}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[{color: colors.primary}, styles.publishText]}>
                Publish
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <ScrollView style={styles.container}>
          <View style={styles.editorContainer}>
            <TextInput
              ref={textInputRef}
              style={[styles.contentInput, {color: colors.text.primary}]}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor={colors.text.tertiary}
              value={content}
              onChangeText={setContent}
              maxLength={2000}
            />

            {/* Image preview section */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{uri: img.uri}}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeImageBtn,
                        {backgroundColor: colors.error},
                      ]}
                      onPress={() => handleRemoveImage(index)}>
                      <Icon name="x" size={12} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Category section */}
            {selectedCategory && (
              <View style={styles.categoryContainer}>
                <CategoryChip
                  category={selectedCategory}
                  selected={true}
                  onPress={handleSelectCategory}
                />
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Icon name="x" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Character count */}
            <Text style={[styles.charCount, {color: colors.text.tertiary}]}>
              {content.length}/2000
            </Text>
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View style={[styles.actionBar, {backgroundColor: colors.card}]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImage}>
            <Icon name="image" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}>
            <Icon name="camera" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSelectCategory}>
            <Icon name="tag" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.visibilitySwitchWrapper}>
            <Text
              style={[styles.visibilityText, {color: colors.text.secondary}]}>
              {isPublic ? 'Public' : 'Private'}
            </Text>
            <TouchableOpacity onPress={() => setIsPublic(!isPublic)}>
              <MaterialIcons
                name={isPublic ? 'public' : 'lock'}
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    padding: 16,
    flex: 1,
  },
  contentInput: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  imageWrapper: {
    margin: 4,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 8,
    fontSize: 12,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  visibilitySwitchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  visibilityText: {
    marginRight: 8,
    fontSize: 14,
  },
  publishText: {
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;
