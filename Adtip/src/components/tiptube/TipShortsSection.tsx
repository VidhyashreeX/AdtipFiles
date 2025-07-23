import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface ShortVideo {
  id: number;
  title: string;
  thumbnail: string;
  creator: string;
  hashtags: string[];
}

interface TipShortsSectionProps {
  shorts?: ShortVideo[];
  onSeeAllPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 cards per row with padding
const CARD_HEIGHT = CARD_WIDTH * 1.5; // Vertical aspect ratio for shorts

// Mock data for demonstration
const mockShorts: ShortVideo[] = [
  {
    id: 1,
    title: 'Food Lover Afooddish',
    thumbnail: 'https://picsum.photos/200/300?random=1',
    creator: 'FoodLover',
    hashtags: ['#shorts', '#daily'],
  },
  {
    id: 2,
    title: 'Food Lover Afooddish',
    thumbnail: 'https://picsum.photos/200/300?random=2',
    creator: 'FoodLover',
    hashtags: ['#shorts', '#daily'],
  },
  {
    id: 3,
    title: 'Cooking Tips',
    thumbnail: 'https://picsum.photos/200/300?random=3',
    creator: 'ChefMaster',
    hashtags: ['#cooking', '#tips'],
  },
  {
    id: 4,
    title: 'Recipe Quick',
    thumbnail: 'https://picsum.photos/200/300?random=4',
    creator: 'QuickRecipes',
    hashtags: ['#recipe', '#quick'],
  },
];

const TipShortsSection: React.FC<TipShortsSectionProps> = ({
  shorts = mockShorts,
  onSeeAllPress,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const styles = createStyles(colors, isDarkMode);

  const handleSeeAllPress = () => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      navigation.navigate('TipShorts' as never);
    }
  };

  const handleShortPress = (short: ShortVideo) => {
    // Navigate to TipShorts with specific video
    navigation.navigate('TipShorts' as never, { videoId: short.id });
  };

  const renderShortCard = ({ item }: { item: ShortVideo }) => (
    <TouchableOpacity
      style={styles.shortCard}
      onPress={() => handleShortPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.shortThumbnail}
        resizeMode="cover"
      />
      
      {/* Overlay Content */}
      <View style={styles.shortOverlay}>
        <View style={styles.shortContent}>
          <Text style={styles.shortTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.shortHashtags}>
            {item.hashtags.join(' ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Tipshorts</Text>
        <TouchableOpacity onPress={handleSeeAllPress} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Shorts Grid */}
      <FlatList
        data={shorts}
        renderItem={renderShortCard}
        keyExtractor={(item) => `short-${item.id}`}
        numColumns={2}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
      />
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingVertical: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#00C853',
    },
    gridContent: {
      paddingHorizontal: 16,
    },
    row: {
      justifyContent: 'space-between',
    },
    separator: {
      height: 12,
    },
    shortCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.border,
      position: 'relative',
    },
    shortThumbnail: {
      width: '100%',
      height: '100%',
    },
    shortOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: 12,
    },
    shortContent: {
      justifyContent: 'flex-end',
    },
    shortTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    shortHashtags: {
      color: '#FFFFFF',
      fontSize: 12,
      opacity: 0.9,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

export default TipShortsSection;
