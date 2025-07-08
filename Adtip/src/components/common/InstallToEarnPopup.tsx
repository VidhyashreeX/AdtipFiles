import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface InstallToEarnPopupProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const InstallToEarnPopup: React.FC<InstallToEarnPopupProps> = ({ visible, onClose, onUpgrade }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Image source={require('../../../assets/images/moneyearn.gif')} style={styles.gif} resizeMode="contain" />
          <Text style={styles.text}>Do you want to earn 2x money then upgrade your premium</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    padding: 24,
    elevation: 8,
  },
  gif: {
    width: 160,
    height: 160,
    marginBottom: 18,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#222',
  },
  upgradeButton: {
    backgroundColor: '#FFA726',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 15,
  },
});

export default InstallToEarnPopup; 