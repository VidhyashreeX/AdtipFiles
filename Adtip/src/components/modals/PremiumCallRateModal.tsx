import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { X, Crown, Phone, Video } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface PremiumCallRateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onContinue: () => void;
  callType?: 'voice' | 'video';
}

const PremiumCallRateModal: React.FC<PremiumCallRateModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  onContinue,
  callType = 'voice'
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
        <View style={[
          styles.modalContainer,
          { 
            backgroundColor: isDarkMode ? colors.card : '#fff',
            borderColor: isDarkMode ? colors.border : '#e0e0e0'
          }
        ]}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {callType === 'video' ? (
                <Video size={32} color={colors.primary} />
              ) : (
                <Phone size={32} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {callType === 'video' ? 'Video Call' : 'Voice Call'} Rates
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Choose your plan for better rates
            </Text>
          </View>

          {/* Rate Comparison */}
          <View style={styles.rateComparison}>
            {/* Non-Premium Rate */}
            <View style={[
              styles.rateCard,
              { 
                backgroundColor: isDarkMode ? colors.surface : '#f8f9fa',
                borderColor: colors.border
              }
            ]}>
              <Text style={[styles.planType, { color: colors.text.secondary }]}>
                Free User
              </Text>
              <Text style={[styles.rate, { color: colors.text.primary }]}>
                ₹7/min
              </Text>
              <Text style={[styles.rateDescription, { color: colors.text.tertiary }]}>
                Standard rate
              </Text>
            </View>

            {/* Premium Rate */}
            <LinearGradient
              colors={['#FFD700', '#FFB300']}
              style={styles.premiumCard}
            >
              <View style={styles.premiumBadge}>
                <Crown size={16} color="#000" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.premiumPlanType}>
                Premium User
              </Text>
              <Text style={styles.premiumRate}>
                ₹4/min
              </Text>
              <Text style={styles.premiumRateDescription}>
                43% savings!
              </Text>
            </LinearGradient>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
              Premium Benefits:
            </Text>
            <View style={styles.benefitsList}>
              <Text style={[styles.benefitItem, { color: colors.text.secondary }]}>
                • Lower call rates (₹4/min vs ₹7/min)
              </Text>
              <Text style={[styles.benefitItem, { color: colors.text.secondary }]}>
                • Earn ₹2 per call acceptance
              </Text>
              <Text style={[styles.benefitItem, { color: colors.text.secondary }]}>
                • Priority customer support
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { 
                  backgroundColor: 'transparent',
                  borderColor: colors.border,
                  borderWidth: 1
                }
              ]}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={[styles.continueButtonText, { color: colors.text.secondary }]}>
                Continue with ₹7/min
              </Text>
            </TouchableOpacity>

            <LinearGradient
              colors={['#FFD700', '#FFB300']}
              style={styles.upgradeButton}
            >
              <TouchableOpacity
                style={styles.upgradeButtonInner}
                onPress={onUpgrade}
                activeOpacity={0.8}
              >
                <Crown size={20} color="#000" />
                <Text style={styles.upgradeButtonText}>
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>
            </LinearGradient>
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
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: screenWidth - 40,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  rateComparison: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  rateCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  planType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  rate: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rateDescription: {
    fontSize: 12,
  },
  premiumCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumPlanType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    color: '#000',
  },
  premiumRate: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  premiumRateDescription: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  benefits: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 6,
  },
  benefitItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    borderRadius: 12,
  },
  upgradeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default PremiumCallRateModal;
