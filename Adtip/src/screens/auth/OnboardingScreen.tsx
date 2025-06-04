import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

// Theme
import {useTheme} from '../../contexts/ThemeContext';

// Constants
const {width} = Dimensions.get('window');

// Onboarding data
const onboardingData = [
  {
    id: '1',
    title: 'Create & Share Content',
    description:
      'Make a channel, upload videos and images that people will love',
    image: require('../../assets/images/onboarding-1.png'),
  },
  {
    id: '2',
    title: 'Earn from your content',
    description:
      'Get rewarded for your quality content with our fair monetization system',
    image: require('../../assets/images/onboarding-2.png'),
  },
  {
    id: '3',
    title: 'Connect & Grow',
    description: 'Connect with other creators and grow your audience together',
    image: require('../../assets/images/onboarding-3.png'),
  },
];

/**
 * Onboarding screen component
 */
const OnboardingScreen = ({navigation}) => {
  // Theme
  const {colors} = useTheme();

  // Local state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation refs
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Handle next slide
  const goToNextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Navigate to login screen when onboarding is complete
      navigation.replace('Login');
    }
  };

  // Handle skip
  const handleSkip = () => {
    navigation.replace('Login');
  };

  // Render dot indicators
  const Dots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index.toString()}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  backgroundColor: colors.primary,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Render onboarding item
  const renderItem = ({item}) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <Text style={[styles.title, {color: colors.text.primary}]}>
          {item.title}
        </Text>
        <Text style={[styles.description, {color: colors.text.tertiary}]}>
          {item.description}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, {color: colors.text.tertiary}]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Onboarding slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        onMomentumScrollEnd={event => {
          const newIndex = Math.floor(
            event.nativeEvent.contentOffset.x / width,
          );
          setCurrentIndex(newIndex);
        }}
      />

      {/* Dots indicator */}
      <Dots />

      {/* Next/Get Started button */}
      <TouchableOpacity
        style={[styles.nextButton, {backgroundColor: colors.primary}]}
        onPress={goToNextSlide}>
        <Text style={styles.nextButtonText}>
          {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    padding: 24,
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    height: 56,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
