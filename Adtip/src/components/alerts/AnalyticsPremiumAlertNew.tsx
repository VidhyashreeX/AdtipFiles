import React, { useEffect } from 'react';
import { Alert } from 'react-native';

interface AnalyticsPremiumAlertProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onGoBack: () => void;
}

const AnalyticsPremiumAlert: React.FC<AnalyticsPremiumAlertProps> = ({
  visible,
  onClose,
  onUpgrade,
  onGoBack,
}) => {
  useEffect(() => {
    if (visible) {
      // Show enhanced alert
      Alert.alert(
        '🚀 Premium Access Required',
        'Unlock powerful analytics insights with Content Creator Premium.\n\n✨ Features:\n• Detailed Analytics Dashboard\n• Revenue Tracking & Insights\n• Audience Demographics\n\nSecure payment • Cancel anytime • Instant access',
        [
          {
            text: 'Go Back',
            style: 'cancel',
            onPress: () => {
              onClose();
              onGoBack();
            }
          },
          {
            text: '👑 Upgrade Now',
            onPress: () => {
              onClose();
              onUpgrade();
            }
          }
        ]
      );
    }
  }, [visible, onUpgrade, onGoBack, onClose]);

  // Return null since we're using Alert.alert
  return null;
};

export default AnalyticsPremiumAlert;
