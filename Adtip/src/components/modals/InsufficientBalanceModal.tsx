import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { BanknoteArrowUp, AlertCircle } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface InsufficientBalanceModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  visible,
  onClose,
  title = 'Insufficient Balance',
  message = 'You do not have enough balance to watch this paid video. Add funds to your wallet to continue.',
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Start entrance animations
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
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Reset animations when modal is hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      pulseAnim.setValue(1);
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim, pulseAnim]);

  const handleClose = () => {
    // Start exit animations
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
    ]).start(() => {
      onClose();
    });
  };

  const handleAddFunds = () => {
    handleClose();
    // Navigate to AddFundsScreen just like the TipCall header does
    (navigation as any).navigate('AddFundsScreen');
  };

  const styles = createStyles(colors, isDarkMode);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
            style={styles.modalCard}
          >
            {/* Header with animated icon */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF5252']}
                  style={styles.iconGradient}
                >
                  <AlertCircle size={32} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.text.secondary }]}>
              {message}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>
                  Got it
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAddFunds}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.primaryButtonGradient}
                >
                  <BanknoteArrowUp size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Add Funds</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayTouch: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    container: {
      width: screenWidth * 0.85,
      maxWidth: 400,
    },
    modalCard: {
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    iconContainer: {
      alignSelf: 'center',
      flex: 1,
      alignItems: 'center',
    },
    iconGradient: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      padding: 4,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 32,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    primaryButtonGradient: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default InsufficientBalanceModal;
