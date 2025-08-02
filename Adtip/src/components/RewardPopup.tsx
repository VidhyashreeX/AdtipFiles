import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface RewardPopupProps {
  visible: boolean;
  earnedAmount: number;
  onClose: () => void;
  onOpenWallet: () => void;
  isPremium?: boolean;
  onUpgradePremium?: () => void;
}

const RewardPopup: React.FC<RewardPopupProps> = ({
  visible,
  earnedAmount,
  onClose,
  onOpenWallet,
  isPremium = false,
  onUpgradePremium,
}) => {
  const { colors, isDarkMode } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* GIF Image using FastImage for better GIF support */}
          <FastImage
            source={require('../assets/gifs/congratulation.gif')}
            style={styles.gifImage}
            resizeMode={FastImage.resizeMode.contain}
          />
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            🎉 Congratulations!
          </Text>

          {/* Earned Amount */}
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.amountContainer}
          >
            <Text style={styles.amountText}>
              ₹{earnedAmount.toFixed(2)}
            </Text>
          </LinearGradient>

          {/* Message */}
          <Text style={[styles.message, { color: colors.text.secondary }]}>
            You've successfully earned ₹{earnedAmount.toFixed(2)} for viewing this content!
          </Text>

          {/* Upgrade message for all users */}
          <View style={styles.upgradeContainer}>
            <Text style={[styles.upgradeMessage, { color: colors.primary }]}>
              💎 Upgrade to Premium to earn up to ₹10 per view!
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.upgradeButton]}
              onPress={onUpgradePremium || (() => {})}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF5722']}
                style={styles.gradientButton}
              >
                <Text style={styles.upgradeButtonText}>🚀 Upgrade Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.walletButton]}
              onPress={onOpenWallet}
            >
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.gradientButton}
              >
                <Text style={styles.walletButtonText}>💰 Open Wallet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 24,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    maxWidth: width * 0.9,
    maxHeight: height * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  gifImage: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  amountContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  amountText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
    fontWeight: '500',
  },
  upgradeContainer: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  upgradeMessage: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButton: {
    // Gradient styling handled by LinearGradient
  },
  upgradeButtonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  walletButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default RewardPopup; 