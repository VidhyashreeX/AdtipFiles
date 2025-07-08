import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

interface PremiumPopupProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumPopup: React.FC<PremiumPopupProps> = ({
  visible,
  onClose,
  onUpgrade
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();

  const handleUpgrade = () => {
    console.log('🚀 [PremiumPopup] User clicked upgrade button');
    onUpgrade();
    onClose();
    navigation.navigate('PremiumUser' as never);
  };

  const handleCancel = () => {
    console.log('❌ [PremiumPopup] User clicked cancel button');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.popupContainer,
          { 
            backgroundColor: isDarkMode ? colors.card : '#fff',
            borderColor: isDarkMode ? colors.border : '#e0e0e0'
          }
        ]}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#FFD700', '#FFB300']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <Icon name="award" size={32} color="#fff" />
              <Text style={styles.headerTitle}>Upgrade to Premium Plan!</Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[
              styles.message,
              { color: colors.text.primary }
            ]}>
              Your premium plan has been expired.
            </Text>
            
            <Text style={[
              styles.subMessage,
              { color: colors.text.secondary }
            ]}>
              Upgrade to premium and earn up to ₹10 per ad.
            </Text>
            
            <Text style={[
              styles.subMessage,
              { color: colors.text.secondary }
            ]}>
              Start earning now!
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                  Earn up to ₹10 per ad view
                </Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                  Reduced platform fees
                </Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                  Faster withdrawal processing
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.upgradeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.upgradeButtonText}>
                  Upgrade Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
  popupContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitsContainer: {
    marginTop: 16,
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PremiumPopup; 