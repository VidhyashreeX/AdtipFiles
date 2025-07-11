import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// Import Lucide React Native icons
import { ChevronRight, Play, Phone, Gamepad2, Download, Coins } from 'lucide-react-native';

// Constants
const {width} = Dimensions.get('window');

// Define the type for animation values
interface AnimValues {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  translateY: Animated.Value;
  bounceAnim: Animated.Value;
  bounceAnim2: Animated.Value;
  bounceAnim3: Animated.Value;
  bounceAnim4: Animated.Value;
  pulseAnim: Animated.Value;
  pulseAnim2: Animated.Value;
  pulseAnim3: Animated.Value;
  pulseAnim4: Animated.Value;
}

// Define props interface for illustration components
interface IllustrationProps {
  animValues: AnimValues;
}

// Illustration components with memoization to prevent unnecessary re-renders
const WelcomeIllustration = React.memo<IllustrationProps>(({animValues}) => (
  <View style={styles.illustrationWrapper}>
    <Animated.View
      style={[
        styles.illustrationContainer,
        {
          backgroundColor: '#E8F5E8',
          opacity: animValues.fadeAnim,
          transform: [{scale: animValues.scaleAnim}],
        },
      ]}>
      {/* Main phone icon */}
      <MaterialIcons name="phone-android" size={60} color="#4A90E2" />

      {/* Floating elements matching web design - positioned to keep 3/4 visible during bounce */}
      <Animated.View
        style={[
          styles.floatingCircle,
          styles.topLeftVisible,
          {backgroundColor: '#2196F3', transform: [{translateY: animValues.bounceAnim3}]},
        ]}>
        <Play size={16} color="white" />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingCircle,
          styles.topRightVisible,
          {backgroundColor: '#FFC107', width: 40, height: 40, borderRadius: 20, transform: [{translateY: animValues.bounceAnim}]},
        ]}>
        <Coins size={20} color="#F57C00" />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingCircle,
          styles.bottomLeftVisible,
          {backgroundColor: '#4CAF50', width: 36, height: 36, borderRadius: 18, transform: [{translateY: animValues.bounceAnim2}]},
        ]}>
        <Text style={{color: 'white', fontSize: 14, fontWeight: 'bold'}}>₹</Text>
      </Animated.View>
    </Animated.View>
  </View>
));

const WatchIllustration = React.memo<IllustrationProps>(({animValues}) => (
  <View style={styles.illustrationWrapper}>
    <Animated.View
      style={[
        styles.illustrationContainer,
        {
          backgroundColor: '#E3F2FD',
          opacity: animValues.fadeAnim,
          transform: [{scale: animValues.scaleAnim}],
        },
      ]}>
      <View style={styles.videoContainer}>
        <Play size={40} color="white" />
      </View>

      {/* Coins */}
      <Animated.View
        style={[
          styles.floatingCircle,
          {
            top: 10,
            right: 10,
            backgroundColor: '#FFC107',
            transform: [{translateY: animValues.pulseAnim}],
          },
        ]}>
        <Text style={{color: '#F57C00', fontSize: 12, fontWeight: 'bold'}}>₹</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingCircle,
          {
            bottom: 10,
            right: 10,
            backgroundColor: '#4CAF50',
            transform: [{translateY: animValues.pulseAnim2}],
          },
        ]}>
        <MaterialIcons name="attach-money" size={16} color="white" />
      </Animated.View>
    </Animated.View>
  </View>
));

const TalkIllustration = React.memo<IllustrationProps>(({animValues}) => (
  <View style={styles.illustrationWrapper}>
    <Animated.View
      style={[
        styles.illustrationContainer,
        {
          backgroundColor: '#F3E5F5',
          opacity: animValues.fadeAnim,
          transform: [{scale: animValues.scaleAnim}],
        },
      ]}>
      <Phone size={60} color="#9C27B0" />

      <Animated.View
        style={[
          styles.centerCircle,
          {
            backgroundColor: '#4CAF50',
            transform: [{translateY: animValues.pulseAnim}],
          },
        ]}>
        <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>₹</Text>
      </Animated.View>

      {/* Audio waves */}
      <Animated.View
        style={[
          styles.audioWave,
          {left: -30, opacity: animValues.pulseAnim, backgroundColor: '#CE93D8'},
        ]}
      />
      <Animated.View
        style={[
          styles.audioWave,
          {left: -20, height: 40, opacity: animValues.pulseAnim2, backgroundColor: '#CE93D8'},
        ]}
      />
      <Animated.View
        style={[
          styles.audioWave,
          {right: -30, opacity: animValues.pulseAnim3, backgroundColor: '#CE93D8'},
        ]}
      />
      <Animated.View
        style={[
          styles.audioWave,
          {right: -20, height: 40, opacity: animValues.pulseAnim4, backgroundColor: '#CE93D8'},
        ]}
      />
    </Animated.View>
  </View>
));

const PlayIllustration = React.memo<IllustrationProps>(({animValues}) => (
  <View style={styles.illustrationWrapper}>
    <Animated.View
      style={[
        styles.illustrationContainer,
        {
          backgroundColor: '#FFF3E0',
          opacity: animValues.fadeAnim,
          transform: [{scale: animValues.scaleAnim}],
        },
      ]}>
      <View style={styles.gamepadContainer}>
        <Gamepad2 size={50} color="white" />
      </View>

      <Animated.View
        style={[
          styles.floatingCircle,
          {top: 10, left: 10, backgroundColor: '#F44336', transform: [{translateY: animValues.bounceAnim}]},
        ]}
      />

      <Animated.View
        style={[
          styles.floatingCircle,
          {top: 10, right: 10, backgroundColor: '#2196F3', transform: [{translateY: animValues.bounceAnim2}]},
        ]}
      />

      <Animated.View
        style={[
          styles.floatingCircle,
          {
            bottom: 10,
            left: 10,
            backgroundColor: '#FFC107',
            transform: [{translateY: animValues.bounceAnim3}],
          },
        ]}>
        <MaterialIcons name="attach-money" size={14} color="#F57C00" />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingCircle,
          {
            bottom: 10,
            right: 10,
            backgroundColor: '#4CAF50',
            transform: [{translateY: animValues.bounceAnim4}],
          },
        ]}>
        <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>₹</Text>
      </Animated.View>
    </Animated.View>
  </View>
));

const InstallIllustration = React.memo<IllustrationProps>(({animValues}) => (
  <View style={styles.illustrationWrapper}>
    <Animated.View
      style={[
        styles.illustrationContainer,
        {
          backgroundColor: '#E0F7FA',
          opacity: animValues.fadeAnim,
          transform: [{scale: animValues.scaleAnim}],
        },
      ]}>
      <MaterialIcons name="phone-android" size={60} color="#00796B" />

      <Animated.View
        style={[
          styles.appIcon,
          {
            top: 15,
            left: 15,
            backgroundColor: '#F44336',
            transform: [{translateY: animValues.bounceAnim}],
          },
        ]}>
        <MaterialIcons name="photo-camera" size={14} color="white" />
      </Animated.View>

      <Animated.View
        style={[
          styles.appIcon,
          {
            top: 15,
            right: 15,
            backgroundColor: '#2196F3',
            transform: [{translateY: animValues.bounceAnim2}],
          },
        ]}>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingCircle,
          {
            bottom: 15,
            left: 15,
            backgroundColor: '#4CAF50',
            transform: [{translateY: animValues.pulseAnim}],
          },
        ]}>
        <Download size={16} color="white" />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingCircle,
          {
            bottom: 15,
            right: 15,
            backgroundColor: '#FFC107',
            transform: [{translateY: animValues.pulseAnim2}],
          },
        ]}>
        <Text style={{color: '#F57C00', fontSize: 12, fontWeight: 'bold'}}>₹</Text>
      </Animated.View>
    </Animated.View>
  </View>
));

// Define the onboarding data item type
interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  illustrationComponent: React.ComponentType<IllustrationProps>;
  backgroundColor: string;
}

// Onboarding data
const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Welcome to Adtip',
    description: 'Earn rewards from videos, chats, games, and more.',
    illustrationComponent: WelcomeIllustration,
    backgroundColor: '#F8F9FA',
  },
  {
    id: '2',
    title: 'Watch & Earn',
    description: 'Watch short ads and videos. Get paid instantly.',
    illustrationComponent: WatchIllustration,
    backgroundColor: '#F8F9FA',
  },
  {
    id: '3',
    title: 'Talk & Earn',
    description: 'Join sponsored calls and earn for your time.',
    illustrationComponent: TalkIllustration,
    backgroundColor: '#F8F9FA',
  },
  {
    id: '4',
    title: 'Play & Earn',
    description: 'Play games and unlock real rewards with every task.',
    illustrationComponent: PlayIllustration,
    backgroundColor: '#F8F9FA',
  },
  {
    id: '5',
    title: 'Install & Earn',
    description: 'Download partner apps and earn instantly.',
    illustrationComponent: InstallIllustration,
    backgroundColor: '#F8F9FA',
  },
];

// Define navigation prop type
interface OnboardingScreenProps {
  navigation: {
    replace: (screen: string) => void;
  };
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({navigation}) => {
  // Theme and Auth
  const {colors} = useTheme();
  const {enterGuestMode} = useAuth();

  // Local state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation refs
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Additional animations for floating elements
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim3 = useRef(new Animated.Value(0)).current;
  const bounceAnim4 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim2 = useRef(new Animated.Value(0.8)).current;
  const pulseAnim3 = useRef(new Animated.Value(0.8)).current;
  const pulseAnim4 = useRef(new Animated.Value(0.8)).current;

  // Start bounce and pulse animations
  useEffect(() => {
    // Create and start all animations
    const animations = [];

    // Bounce animations
    const createBounceAnimation = (animValue, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -8,
            duration: duration,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Pulse animations
    const createPulseAnimation = (animValue, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.8,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    animations.push(createBounceAnimation(bounceAnim, 1000, 0));
    animations.push(createBounceAnimation(bounceAnim2, 1200, 200));
    animations.push(createBounceAnimation(bounceAnim3, 800, 400));
    animations.push(createBounceAnimation(bounceAnim4, 1100, 600));
    
    animations.push(createPulseAnimation(pulseAnim, 1500, 0));
    animations.push(createPulseAnimation(pulseAnim2, 1800, 300));
    animations.push(createPulseAnimation(pulseAnim3, 1300, 600));
    animations.push(createPulseAnimation(pulseAnim4, 1600, 900));

    // Start all animations
    animations.forEach(animation => animation.start());

    return () => {
      // Clean up animations
      animations.forEach(animation => animation.stop());
    };
  }, []);

  // Define getItemLayout for FlatList optimization
  const getItemLayout = useCallback(
    (data, index) => ({
      length: width,
      offset: width * index,
      index,
    }),
    []
  );

  // Handle next slide
  const goToNextSlide = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      // Navigate to login screen when onboarding is complete
      navigation.replace('Login');
    }
  }, [currentIndex, buttonScale, navigation]);

  // Handle guest mode
  const handleTryNow = useCallback(async () => {
    try {
      await enterGuestMode();
      // Navigation will be handled by UltraFastLoader based on guest state
    } catch (error) {
      console.error('Failed to enter guest mode:', error);
    }
  }, [enterGuestMode]);

  // Render dot indicators
  const Dots = useCallback(() => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={index.toString()}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive ? '#4CAF50' : '#E0E0E0',
                  width: isActive ? 24 : 8,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }, [currentIndex]);

  // Render onboarding item
  const renderItem = useCallback(({item}) => {
    const IllustrationComponent = item.illustrationComponent;

    // Animation values to pass to illustration components
    const animValues = {
      fadeAnim,
      scaleAnim,
      translateY,
      bounceAnim,
      bounceAnim2,
      bounceAnim3,
      bounceAnim4,
      pulseAnim,
      pulseAnim2,
      pulseAnim3,
      pulseAnim4,
    };

    return (
      <View style={[styles.slide, {backgroundColor: item.backgroundColor}]}>
        <IllustrationComponent animValues={animValues} />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  }, [fadeAnim, scaleAnim, translateY, bounceAnim, bounceAnim2, bounceAnim3, bounceAnim4, pulseAnim, pulseAnim2, pulseAnim3, pulseAnim4]);

  // Handle scroll end
  const handleMomentumScrollEnd = useCallback((event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8F9FA" barStyle="dark-content" />

      {/* Dot indicators at top */}
      <Dots />

      {/* Onboarding slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
      />

      {/* Bottom navigation controls */}
      <View style={styles.navigationContainer}>
        {/* Try Now button - now shows on all slides */}
        <TouchableOpacity style={styles.tryNowButton} onPress={handleTryNow}>
          <Text style={styles.tryNowText}>Try Now</Text>
        </TouchableOpacity>

        <Animated.View style={{transform: [{scale: buttonScale}]}}>
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.8}
            onPress={goToNextSlide}>
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {currentIndex < onboardingData.length - 1 && (
              <ChevronRight size={20} color="#FFFFFF" style={styles.nextIcon} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Dots styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    height: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // Slide styles
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  // Text styles
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
    marginBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666666',
  },
  // Navigation styles
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FA',
  },

  nextButton: {
    flexDirection: 'row',
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextIcon: {
    marginLeft: 8,
  },
  // Try Now button styles - outline style, 44px height
  tryNowButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  tryNowText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  // Illustration styles
  illustrationWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
    height: width * 0.8,
  },
  illustrationContainer: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'visible',
  },
  floatingCircle: {
    position: 'absolute',
    width: 32, // Increased from 24 to 32
    height: 32, // Increased from 24 to 32
    borderRadius: 16, // Increased from 12 to 16
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Updated positioning to keep 3/4 of circles visible during bounce animation
  // With bigger circles (32px), adjusting positions accordingly
  topLeftVisible: {
    top: 4, // 32px circle: 4px from top means 24px (3/4) visible, even with -8px bounce
    left: 4, // 4px from left means 24px (3/4) visible
  },
  topRightVisible: {
    top: 6, // 40px circle: 6px from top means 30px (3/4) visible, even with -8px bounce
    right: 6, // 6px from right means 30px (3/4) visible
  },
  bottomLeftVisible: {
    bottom: 5, // 36px circle: 5px from bottom means 27px (3/4) visible during bounce
    left: 5, // 5px from left means 27px (3/4) visible
  },
  
  // Keep existing positioning styles for other illustrations
  topLeft: {
    top: -12,
    left: -12,
  },
  topRight: {
    top: -16,
    right: -16,
  },
  bottomLeft: {
    bottom: -14,
    left: -14,
  },
  bottomRight: {
    bottom: 15,
    right: 15,
  },
  
  centerCircle: {
    width: 52, // Increased from 44 to 52
    height: 52, // Increased from 44 to 52
    borderRadius: 26, // Increased from 22 to 26
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  videoContainer: {
    width: width * 0.4,
    height: width * 0.28,
    backgroundColor: '#37474F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamepadContainer: {
    width: width * 0.35,
    height: width * 0.3,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  audioWave: {
    position: 'absolute',
    width: 6,
    height: 28,
    borderRadius: 3,
    top: '50%',
    marginTop: -14,
  },
  appIcon: {
    position: 'absolute',
    width: 28, // Increased from 24 to 28
    height: 28, // Increased from 24 to 28
    borderRadius: 7, // Increased from 6 to 7
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default OnboardingScreen;
