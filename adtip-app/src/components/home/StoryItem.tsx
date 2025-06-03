// app/components/home/StoryItem.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Plus} from 'lucide-react-native';
import {useRouter} from 'expo-router';
import {AppRoutes} from '../../_routes';

interface StoryItemProps {
  isAddStory?: boolean;
  imageUrl?: string;
  username?: string;
  onPress?: () => void;
}

export function StoryItem({
  isAddStory = false,
  imageUrl,
  username,
  onPress,
}: StoryItemProps) {
  const router = useRouter();

  const handlePress = () => {
    if (isAddStory) {
      router.push('/upload-story' as AppRoutes);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.storyCircle, isAddStory && styles.addStoryCircle]}>
        {isAddStory ? (
          <Plus color="#24d05a" size={32} />
        ) : (
          <View style={styles.storyImageContainer}>
            {imageUrl ? (
              <Image source={{uri: imageUrl}} style={styles.storyImage} />
            ) : (
              <View style={styles.placeholderImage} />
            )}
          </View>
        )}
      </View>
      <Text style={styles.username}>{isAddStory ? 'Add Story' : username}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addStoryCircle: {
    backgroundColor: '#ecfdf5',
    borderColor: '#24d05a',
  },
  storyImageContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  username: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
});
