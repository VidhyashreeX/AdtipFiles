import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';

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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* GIF Image using FastImage for better GIF support */}
          <FastImage
            source={require('../assets/gifs/congratulation.gif')}
            style={styles.gifImage}
            resizeMode={FastImage.resizeMode.contain}
          />
          
          {/* Title */}
          <Text style={styles.title}>
            Hurray! u Earned Rs {earnedAmount.toFixed(2)}
          </Text>
          
          {/* Message */}
          <Text style={styles.message}>
            Congratualtions you have earned Rs {earnedAmount.toFixed(2)} pasie
          </Text>

          {/* Upgrade message for non-premium users */}
          {!isPremium && (
            <Text style={styles.upgradeMessage}>
              Upgrade now to earn upto rs10 per view
            </Text>
          )}
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Got it thanks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.walletButton]}
              onPress={onOpenWallet}
            >
              <Text style={styles.walletButtonText}>open wallet</Text>
            </TouchableOpacity>
          </View>

          {/* Upgrade button for non-premium users */}
          {!isPremium && onUpgradePremium && (
            <TouchableOpacity
              style={[styles.button, styles.upgradeButton]}
              onPress={onUpgradePremium}
            >
              <Text style={styles.upgradeButtonText}>upgrade now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    maxWidth: width * 0.85,
    maxHeight: height * 0.7,
  },
  gifImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  upgradeMessage: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  walletButton: {
    backgroundColor: '#4CAF50',
  },
  upgradeButton: {
    backgroundColor: '#FF6B35',
    width: '100%',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  walletButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RewardPopup; 