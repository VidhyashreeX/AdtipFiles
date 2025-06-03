// src/components/home/StoryItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

interface StoryItemProps {
  isAddStory?: boolean;
  imageUrl?: string;
  username?: string;
  onPress?: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ 
  isAddStory = false, 
  imageUrl, 
  username, 
  onPress 
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[
        styles.storyCircle, 
        isAddStory && [styles.addStoryCircle, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }],
        { borderColor: colors.borderLight || '#EEEEEE' }
      ]}>
        {isAddStory ? (
          <Icon name="plus" color={colors.primary} size={24} />
        ) : (
          <View style={styles.storyImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.storyImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.gray[100] }]} />
            )}
          </View>
        )}
      </View>
      <Text style={[styles.username, { color: colors.text.secondary }]}>
        {isAddStory ? 'Add Story' : (username ? String(username) : '')}
      </Text>
    </TouchableOpacity>
  );
};

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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addStoryCircle: {
    borderWidth: 2,
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
    borderRadius: 27,
  },
  username: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default StoryItem;
