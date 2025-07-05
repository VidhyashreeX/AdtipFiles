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
    icon: <Headphones size={48} color="#fff" />,
    gradient: ['#114357', '#f29492'],       
  },
  {
    id: 2,
    title: 'Watch to Earn',
    description: 'Earn ₹10 per Ad – Just by Watching',
    icon: <PlayCircle size={48} color="#fff" />,
    gradient: ['#43cea2', '#185a9d'],  // 
  
  },
  {
    id: 3,
    title: 'Refer & Earn',
    description: 'Get ₹3 for every successful referral and earn ₹30 for each premium upgrade',
    icon: <Users size={48} color="#fff" />,
    gradient: ['#fc00ff', '#00dbde' ],
  },
  {
    id: 4,
    title: 'Upload',
    description: 'Upload video to get 100 for 10,000 views.',
    icon: <UploadCloud size={48} color="#fff" />,
    gradient: ['#6a3093', '#a044ff'],    //#6a3093
  },
];

const BannerCarousel: React.FC = () => {
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
          )}
        />
      </View>
      {/* Dots Indicator */}
      {STATIC_BANNERS.length > 1 && (
        <View style={styles.dotsContainer}>
          {STATIC_BANNERS.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
                },
              ]}
              onPress={() => handleDotPress(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  carouselContainer: {
    height: 132,
    width: screenWidth,
  },
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
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default BannerCarousel; 