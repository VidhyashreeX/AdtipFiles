import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { IndianRupee, Gift, Star, Wallet, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModernRewardPopupProps {
  visible: boolean;
  onClose: () => void;
  isPremium: boolean;
  earnedAmount: number;
  onAction: (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => void;
}

const ModernRewardPopup: React.FC<ModernRewardPopupProps> = ({
  visible,
  onClose,
  isPremium,
  earnedAmount,
  onAction,
}) => {
  const { colors, isDarkMode } = useTheme();

  const handleAction = (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => {
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
            colors={isPremium ? ['#FFD700', '#FFA500'] : ['#FF6B35', '#FF8A65']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              {isPremium ? (
                <Star size={32} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Gift size={32} color="#FFFFFF" />
              )}
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {isPremium ? (
              <>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  🎉 Congratulations!
                </Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  You've earned a premium reward
                </Text>
                
                <View style={styles.amountContainer}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
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
                  Premium rewards are automatically added to your wallet
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  🎁 Reward Earned!
                </Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  You've earned your reward
                </Text>
                
                <View style={styles.amountContainer}>
                  <LinearGradient
                    colors={['#FF6B35', '#FF8A65']}
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
                  Upgrade to premium to earn up to ₹0.10 per ad!
                </Text>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isPremium ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleAction('gotit')}
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
                    View Wallet
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleAction('upgrade')}
                >
                  <LinearGradient
                    colors={['#FF6B35', '#FF8A65']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Star size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Upgrade Premium</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.secondaryButtonsRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, styles.smallButton, { borderColor: colors.border }]}
                    onPress={() => handleAction('gotit')}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                      Got it
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, styles.smallButton, { borderColor: colors.border }]}
                    onPress={() => handleAction('wallet')}
                  >
                    <Wallet size={14} color={colors.text.primary} />
                    <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                      Wallet
                    </Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: Math.min(screenWidth - 40, 360),
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
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
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 52,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 48,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallButton: {
    flex: 1,
    height: 44,
  },
});

export default ModernRewardPopup;
