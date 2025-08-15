import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Loader } from 'lucide-react-native';

interface CallConnectingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const CallConnectingOverlay: React.FC<CallConnectingOverlayProps> = ({
  isVisible,
  message = 'Ringing...'
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Continuous rotation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => {
        spinAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
      <View style={styles.container}>
        <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
          <Loader size={40} color="#00D4AA" strokeWidth={2} />
        </Animated.View>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  container: {
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default CallConnectingOverlay;
