import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  visible,
  onClose,
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon.",
  feature = "Paid Video Analytics",
}) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim]);

  const styles = createStyles(colors, isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Gradient Background */}
          <LinearGradient
            colors={isDarkMode 
              ? ['#1a1a2e', '#16213e', '#0f3460'] 
              : ['#667eea', '#764ba2', '#f093fb']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Icon name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Icon name="clock" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Feature Name */}
              <Text style={styles.featureName}>{feature}</Text>

              {/* Description */}
              <Text style={styles.description}>{description}</Text>

              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Advanced Analytics Dashboard</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Revenue Tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Audience Insights</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onClose}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Got it!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    backdropTouchable: {
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: SCREEN_WIDTH - 40,
      maxWidth: 400,
      borderRadius: 24,
      overflow: 'hidden',
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    gradientBackground: {
      padding: 0,
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    content: {
      padding: 32,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 24,
    },
    iconGradient: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
    },
    featureName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 16,
      opacity: 0.9,
    },
    description: {
      fontSize: 16,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      opacity: 0.8,
    },
    featuresList: {
      alignSelf: 'stretch',
      marginBottom: 32,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureText: {
      fontSize: 14,
      color: '#FFFFFF',
      marginLeft: 12,
      opacity: 0.9,
    },
    actionButton: {
      alignSelf: 'stretch',
      borderRadius: 16,
      overflow: 'hidden',
    },
    buttonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default ComingSoonModal;
