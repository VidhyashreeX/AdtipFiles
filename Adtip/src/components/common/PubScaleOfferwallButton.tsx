// src/components/common/PubScaleOfferwallButton.tsx
// Commented out PubScale integration - June 2, 2025
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
// import RewardService from '../../services/RewardService';

interface PubScaleOfferwallButtonProps {
  title?: string;
  onPress?: () => void;
  style?: any;
}

const PubScaleOfferwallButton: React.FC<PubScaleOfferwallButtonProps> = ({
  title = 'Earn Rewards',
  onPress,
  style,
}) => {
  const {colors} = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);
  const handleShowOfferwall = async () => {
    if (onPress) {
      onPress();
    }

    setIsLoading(true);
    try {
      // Commented out PubScale integration - June 2, 2025
      // await RewardService.showOfferwall();

      // Show temporary message while PubScale is disabled
      Alert.alert(
        'Feature Disabled',
        'The offerwall feature is currently disabled. Please check back later.',
      );
    } catch (error) {
      console.error('Error showing offerwall:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, {backgroundColor: colors.primary}, style]}
      onPress={handleShowOfferwall}
      disabled={isLoading}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PubScaleOfferwallButton;
