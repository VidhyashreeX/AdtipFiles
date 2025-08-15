import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Phone, Video, MessageCircle, Ban } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useBlocklist } from '../../hooks/useBlocklist';
import { useWallet } from '../../hooks/useWallet';
import CallController from '../../services/calling/CallController';
import CallBillingService from '../../services/calling/CallBillingService';
import { CallType } from '../../stores/callStoreSimplified';
import ApiService from '../../services/ApiService';
import CallConfirmationAlert from '../alerts/CallConfirmationAlert';
import PremiumCallRateAlert from '../alerts/PremiumCallRateAlert';
import PremiumPopup from '../common/PremiumPopup';

interface CommunicationButtonsProps {
  channelInfo: {
    channelId: string;
    channelName: string;
    createdBy: number;
    isSubscribed: boolean;
  };
  isMyChannel: boolean;
}

const ChannelCommunicationButtons: React.FC<CommunicationButtonsProps> = ({
  channelInfo,
  isMyChannel,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance, isPremium } = useWallet();
  const navigation = useNavigation<any>();
  const { blockUser, isUserBlocked } = useBlocklist();

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [pendingCallData, setPendingCallData] = useState<any>(null);
  const [showCallConfirmationAlert, setShowCallConfirmationAlert] = useState(false);
  const [showPremiumCallRateAlert, setShowPremiumCallRateAlert] = useState(false);

  // Initialize services
  const callController = CallController.getInstance();
  const billingService = CallBillingService.getInstance();

  // Handle call initiation with billing check (same as TipCallScreenSimple)
  const handleStartCall = useCallback(
    async (callType: CallType) => {
      if (!user?.id) {
        Alert.alert('Login Required', 'Please login to make calls');
        return;
      }

      if (isMyChannel) {
        Alert.alert('Invalid Action', 'You cannot call your own channel');
        return;
      }

      const recipientId = channelInfo.createdBy.toString();
      const recipientName = channelInfo.channelName;

      try {
        // Check if user is premium - if not, show premium rate alert first
        if (!isPremium) {
          console.log('[ChannelCommunicationButtons] Non-premium user, showing rate comparison alert');
          setPendingCallData({ recipientId, recipientName, callType });
          setShowPremiumCallRateAlert(true);
          return;
        }

        // Get current balance
        const numericBalance = typeof balance === 'number' ? balance : parseFloat(balance?.toString() || '0');

        // Calculate billing info to show user
        const billingInfo = await billingService.calculateCallBilling(
          user?.id?.toString() || '',
          callType,
          numericBalance,
          isPremium
        );

        const maxMinutes = Math.floor(billingInfo.maxDurationSeconds / 60);
        const rateText = billingService.formatCurrency(billingInfo.ratePerMinute);

        // Show custom confirmation alert with billing information
        setPendingCallData({
          recipientId,
          recipientName,
          callType,
          rateText,
          maxMinutes,
          currentBalance: billingService.formatCurrency(numericBalance)
        });
        setShowCallConfirmationAlert(true);
      } catch (error) {
        console.error('[ChannelCommunicationButtons] Start call error:', error);
        Alert.alert('Error', 'Failed to start call. Please try again.');
      }
    },
    [callController, billingService, balance, isPremium, user?.id, channelInfo, isMyChannel]
  );

  // Handle voice call
  const handleVoiceCall = useCallback(() => {
    handleStartCall('voice');
  }, [handleStartCall]);

  // Handle video call
  const handleVideoCall = useCallback(() => {
    handleStartCall('video');
  }, [handleStartCall]);

  // Handle premium alert actions
  const handlePremiumAlertUpgrade = useCallback(() => {
    setShowPremiumCallRateAlert(false);
    setPendingCallData(null);
    navigation.navigate('PremiumUser' as never);
  }, [navigation]);

  const handlePremiumAlertContinue = useCallback(() => {
    setShowPremiumCallRateAlert(false);
    if (pendingCallData) {
      const { recipientId, recipientName, callType } = pendingCallData;
      setPendingCallData(null);
      // Continue with the call at non-premium rates
      initiateCall(recipientId, recipientName, callType);
    }
  }, [pendingCallData]);

  const handlePremiumAlertClose = useCallback(() => {
    setShowPremiumCallRateAlert(false);
    setPendingCallData(null);
  }, []);

  // Handle call confirmation alert actions
  const handleCallConfirmation = useCallback(async () => {
    if (!pendingCallData) return;

    setShowCallConfirmationAlert(false);

    try {
      const success = await callController.startCall(
        pendingCallData.recipientId,
        pendingCallData.recipientName,
        pendingCallData.callType
      );

      if (!success) {
        Alert.alert(
          'Call Failed',
          'Unable to start the call. The user may be unavailable.'
        );
      }
    } catch (error) {
      console.error('[ChannelCommunicationButtons] Call confirmation error:', error);
      Alert.alert('Error', 'Failed to start call. Please try again.');
    } finally {
      setPendingCallData(null);
    }
  }, [pendingCallData, callController]);

  const handleCallCancel = useCallback(() => {
    setShowCallConfirmationAlert(false);
    setPendingCallData(null);
  }, []);

  // Initiate call function (for non-premium users)
  const initiateCall = useCallback(
    async (recipientId: string, recipientName: string, callType: CallType) => {
      try {
        // Get current balance
        const numericBalance = typeof balance === 'number' ? balance : parseFloat(balance?.toString() || '0');

        // Calculate billing info to show user
        const billingInfo = await billingService.calculateCallBilling(
          user?.id?.toString() || '',
          callType,
          numericBalance,
          isPremium
        );

        const maxMinutes = Math.floor(billingInfo.maxDurationSeconds / 60);
        const rateText = billingService.formatCurrency(billingInfo.ratePerMinute);

        // Show custom confirmation alert with billing information
        setPendingCallData({
          recipientId,
          recipientName,
          callType,
          rateText,
          maxMinutes,
          currentBalance: billingService.formatCurrency(numericBalance)
        });
        setShowCallConfirmationAlert(true);
      } catch (error) {
        console.error('[ChannelCommunicationButtons] Initiate call error:', error);
        Alert.alert('Error', 'Failed to start call. Please try again.');
      }
    },
    [callController, billingService, balance, isPremium, user?.id]
  );

  // Handle chat (same as TipCallScreenSimple)
  const handleChat = useCallback(() => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to start chatting');
      return;
    }

    if (isMyChannel) {
      Alert.alert('Invalid Action', 'You cannot chat with your own channel');
      return;
    }

    if (!isPremium) {
      setShowPremiumPopup(true);
      return;
    }

    // Navigate to FCM chat system
    navigation.navigate('FCMChat', {
      participantId: channelInfo.createdBy.toString(),
      participantName: channelInfo.channelName || 'Channel Owner'
    });
  }, [user?.id, isMyChannel, isPremium, channelInfo, navigation]);



  // Handle block user
  const handleBlockUser = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to block users');
      return;
    }

    if (isMyChannel) {
      Alert.alert('Invalid Action', 'You cannot block your own channel');
      return;
    }

    const isBlocked = isUserBlocked(channelInfo.createdBy.toString());

    Alert.alert(
      isBlocked ? 'Unblock User' : 'Block User',
      isBlocked
        ? `Are you sure you want to unblock ${channelInfo.channelName}?`
        : `Are you sure you want to block ${channelInfo.channelName}? They won't be able to call you anymore.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setIsLoading('block');
              await blockUser(
                channelInfo.createdBy.toString(),
                channelInfo.channelName
              );
              Alert.alert(
                'Success',
                `${channelInfo.channelName} has been ${isBlocked ? 'unblocked' : 'blocked'}.`
              );
            } catch (error) {
              console.error('[ChannelCommunication] Failed to block/unblock user:', error);
              Alert.alert('Error', `Failed to ${isBlocked ? 'unblock' : 'block'} user. Please try again.`);
            } finally {
              setIsLoading(null);
            }
          },
        },
      ]
    );
  }, [user?.id, isMyChannel, channelInfo, blockUser, isUserBlocked]);

  // Don't show communication buttons for own channel
  if (isMyChannel) {
    return null;
  }

  const styles = createStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Connect with {channelInfo.channelName}</Text>
      
      <View style={styles.buttonsContainer}>
        {/* Voice Call Button */}
        <TouchableOpacity
          style={[styles.communicationButton, styles.voiceCallButton]}
          onPress={handleVoiceCall}
          disabled={isLoading === 'voice'}
          activeOpacity={0.8}
        >
          {isLoading === 'voice' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Phone size={18} color="#FFFFFF" />
          )}
          <Text style={styles.voiceCallButtonText}>
            {isLoading === 'voice' ? 'Calling...' : 'Voice Call'}
          </Text>
        </TouchableOpacity>

        {/* Video Call Button */}
        <TouchableOpacity
          style={[styles.communicationButton, styles.videoCallButton]}
          onPress={handleVideoCall}
          disabled={isLoading === 'video'}
          activeOpacity={0.8}
        >
          {isLoading === 'video' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Video size={18} color="#FFFFFF" />
          )}
          <Text style={styles.videoCallButtonText}>
            {isLoading === 'video' ? 'Ringing...' : 'Video Call'}
          </Text>
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={[styles.communicationButton, styles.chatButton]}
          onPress={handleChat}
          disabled={isLoading === 'chat'}
          activeOpacity={0.8}
        >
          {isLoading === 'chat' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MessageCircle size={18} color={colors.primary} />
          )}
          <Text style={[styles.chatButtonText, { color: colors.primary }]}>
            {isLoading === 'chat' ? 'Opening...' : 'Chat'}
          </Text>
        </TouchableOpacity>



        {/* Block Button */}
        <TouchableOpacity
          style={[styles.communicationButton, styles.blockButton]}
          onPress={handleBlockUser}
          disabled={isLoading === 'block'}
          activeOpacity={0.8}
        >
          {isLoading === 'block' ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ban size={18} color={colors.error} />
          )}
          <Text style={[styles.blockButtonText, { color: colors.error }]}>
            {isLoading === 'block'
              ? 'Processing...'
              : isUserBlocked(channelInfo.createdBy.toString())
                ? 'Unblock'
                : 'Block'
            }
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.disclaimer}>
        Communication features may have charges. Check your subscription for details.
      </Text>

      {/* Premium Popup */}
      <PremiumPopup
        visible={showPremiumPopup}
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => {
          setShowPremiumPopup(false);
          navigation.navigate('SubscriptionScreen' as never);
        }}
      />

      {/* Premium Call Rate Alert */}
      <PremiumCallRateAlert
        visible={showPremiumCallRateAlert}
        onClose={handlePremiumAlertClose}
        onUpgrade={handlePremiumAlertUpgrade}
        onContinue={handlePremiumAlertContinue}
        callType={pendingCallData?.callType}
      />

      {/* Call Confirmation Alert */}
      <CallConfirmationAlert
        visible={showCallConfirmationAlert}
        onClose={handleCallCancel}
        onConfirm={handleCallConfirmation}
        callType={pendingCallData?.callType || 'voice'}
        recipientName={pendingCallData?.recipientName || ''}
        rateText={pendingCallData?.rateText || ''}
        maxMinutes={pendingCallData?.maxMinutes || 0}
        currentBalance={pendingCallData?.currentBalance || ''}
        isPremium={isPremium}
      />
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? colors.card : colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  communicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: '48%',
    flex: 1,
    gap: 6,
  },
  voiceCallButton: {
    backgroundColor: '#10B981', // Green for voice calls
  },
  videoCallButton: {
    backgroundColor: '#3B82F6', // Blue for video calls
  },
  chatButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  voiceCallButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  videoCallButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blockButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ChannelCommunicationButtons;
