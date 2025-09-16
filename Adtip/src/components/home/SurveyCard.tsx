// src/components/home/SurveyCard.tsx - Survey offerwall card component

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Logger } from '../../utils/ProductionLogger';

const { width: screenWidth } = Dimensions.get('window');

interface SurveyCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradientColors: string[];
  url: string;
  earnings: string;
  estimatedTime: string;
  rating: number;
  isActive: boolean;
  onPress?: () => void;
}

const SurveyCard: React.FC<SurveyCardProps> = ({
  id,
  name,
  description,
  icon,
  color,
  gradientColors,
  url,
  earnings,
  estimatedTime,
  rating,
  isActive,
  onPress
}) => {
  const { colors, isDarkMode } = useTheme();

  const handleCardPress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!isActive) {
      Alert.alert(
        'Coming Soon!',
        `${name} will be available soon. Stay tuned for updates!`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        Logger.info('SurveyCard', `Opened ${name} survey: ${url}`);
      } else {
        Alert.alert(
          'Error',
          `Cannot open ${name}. Please check your internet connection and try again.`,
          [{ text: 'OK', style: 'destructive' }]
        );
      }
    } catch (error) {
      Logger.error('SurveyCard', `Error opening ${name} survey:`, error);
      Alert.alert(
        'Error',
        `Failed to open ${name}. Please try again later.`,
        [{ text: 'OK', style: 'destructive' }]
      );
    }
  };

  const cardWidth = (screenWidth - 60) / 3; // 3 cards with margins

  const styles = createSurveyCardStyles(colors, isDarkMode, cardWidth, isActive);

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={handleCardPress}
      activeOpacity={0.8}
      disabled={!isActive}
    >
      <LinearGradient
        colors={isActive ? gradientColors : ['#9E9E9E', '#757575']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.cardContent}>
          {/* Icon and Status */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
            {!isActive && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.description} numberOfLines={2}>{description}</Text>
            
            {/* Earnings and Time */}
            <View style={styles.infoContainer}>
              <Text style={styles.earnings}>{earnings}</Text>
              <Text style={styles.time}>{estimatedTime}</Text>
            </View>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={styles.rating}>{rating}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createSurveyCardStyles = (colors: any, isDarkMode: boolean, cardWidth: number, isActive: boolean) => StyleSheet.create({
  cardContainer: {
    width: cardWidth,
    height: 140,
    marginHorizontal: 5,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    opacity: isActive ? 1 : 0.7,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 12,
    marginBottom: 4,
  },
  infoContainer: {
    marginVertical: 2,
  },
  earnings: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  time: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
  },
});

export default SurveyCard;