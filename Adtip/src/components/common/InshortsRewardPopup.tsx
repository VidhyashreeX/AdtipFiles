import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { IndianRupee, Star, X, Wallet } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface InshortsRewardPopupProps {
  visible: boolean;
  onClose: () => void;
  isPremium: boolean;
  earnedAmount: number;
  onAction: (action: 'startNow' | 'gotIt' | 'wallet') => void;
}

const InshortsRewardPopup: React.FC<InshortsRewardPopupProps> = ({
  visible,
  onClose,
  isPremium,
  earnedAmount,
  onAction,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();

  const handleAction = (action: 'startNow' | 'gotIt' | 'wallet') => {
    console.log('🎁 [InshortsRewardPopup] Action triggered:', action);
    
    if (action === 'startNow') {
      // Navigate to PremiumUser component
      console.log('🚀 [InshortsRewardPopup] Navigating to PremiumUser component');
      navigation.navigate('PremiumUser' as never);
    }
    
    onAction(action);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Header with Gradient */}
          <LinearGradient
            colors={isPremium ? ['#FFD700', '#FFA500'] : ['#4CAF50', '#8BC34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              {isPremium ? (
                <Star size={32} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <IndianRupee size={32} color="#FFFFFF" />
              )}
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              🎉 Congratulations 🥳
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              You've earned ₹{earnedAmount.toFixed(2)} for every 10 inshorts!
            </Text>

            <View style={styles.amountContainer}>
              <LinearGradient
                colors={isPremium ? ['#FFD700', '#FFA500'] : ['#4CAF50', '#8BC34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.amountGradient}
              >
                <IndianRupee size={24} color="#FFFFFF" />
                <Text style={styles.amountText}>
                  {earnedAmount.toFixed(2)}
                </Text>
              </LinearGradient>
            </View>

            <Text style={[styles.description, { color: colors.text.secondary }]}>
              Credited to your AdTip wallet. {!isPremium && 'Upgrade to premium and earn ₹10 rs every 5 inshorts'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isPremium ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleAction('gotIt')}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Got it!</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => handleAction('wallet')}
                >
                  <Wallet size={16} color={colors.text.primary} />
                  <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                    Open Wallet
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleAction('startNow')}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#8BC34A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Star size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Start Now</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => handleAction('gotIt')}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                    Got it!
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  headerGradient: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  amountContainer: {
    marginVertical: 20,
  },
  amountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  buttonContainer: {
    padding: 25,
    gap: 12,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 50,
  },
  secondaryButton: {
    height: 45,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InshortsRewardPopup; 