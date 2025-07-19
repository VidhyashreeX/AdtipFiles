import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Headphones, PlayCircle, Users, UploadCloud } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const STATIC_BANNERS = [
  {
    id: 1,
    title: 'Talk to Earn',
    description: 'Earn on Every Call: ₹2/min (Premium)\n₹0.60/min (Free)',
    icon: <Headphones size={32} color="#fff" />,
    gradient: ['#114357', '#f29492'],       
  },
  {
    id: 2,
    title: 'Watch to Earn',
    description: 'Earn ₹10 per Ad – Just by Watching',
    icon: <PlayCircle size={32} color="#fff" />,
    gradient: ['#43cea2', '#185a9d'],  // 
  
  },
  {
    id: 3,
    title: 'Refer & Earn',
    description: 'Get ₹3 for every successful referral and earn ₹30 for each premium upgrade',
    icon: <Users size={32} color="#fff" />,
    gradient: ['#c33764', '#1d2671' ],  // 
  },
  {
    id: 4,
    title: 'Upload',
    description: 'Upload video to get ₹100 for 10,000 views.',
    icon: <UploadCloud size={32} color="#fff" />,
    gradient: ['#6a3093', '#a044ff'],    //#6a3093
  },
];

interface BannerCarouselProps {
  onBannerPress?: (bannerId: number) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ onBannerPress }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<any>(null);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (STATIC_BANNERS.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % STATIC_BANNERS.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  const handleDotPress = (index: number) => {
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}> 
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={STATIC_BANNERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={screenWidth}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => onBannerPress && onBannerPress(item.id)}>
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerCard}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.textContainer}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerDescription}>{item.description}</Text>
                  </View>
                  <View style={styles.iconContainer}>{item.icon}</View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      </View>
      {/* Dots Indicator */}
      {STATIC_BANNERS.length > 1 && (
        <View style={styles.dotsContainer}>
          {STATIC_BANNERS.map((banner, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
            >
              {index === currentIndex ? (
                <LinearGradient
                  colors={banner.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.dot,
                    {
                      transform: [{ scale: 1.3 }],
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      transform: [{ scale: 1 }],
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  carouselContainer: {
    height: 112,
    width: screenWidth,
  },
  bannerCard: {
    width: screenWidth - 32, // Account for horizontal padding
    height: 100,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  iconContainer: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
});

export default BannerCarousel; 