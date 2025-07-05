import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface SingleBannerCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const SingleBannerCard: React.FC<SingleBannerCardProps> = ({ title, description, icon, gradient }) => {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bannerCard}
    >
      <View style={styles.bannerContent}>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>{title}</Text>
          <Text style={styles.bannerDescription}>{description}</Text>
        </View>
        <View style={styles.iconContainer}>{icon}</View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bannerCard: {
    width: screenWidth,
    height: 120,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
    lineHeight: 22,
  },
  iconContainer: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SingleBannerCard; 