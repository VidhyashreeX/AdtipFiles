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
import { Phone, Video, MessageCircle, Mail, Ban } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useBlocklist } from '../../hooks/useBlocklist';

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
  const navigation = useNavigation<any>();
  const { blockUser, isUserBlocked } = useBlocklist();

  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Handle voice call
  const handleVoiceCall = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to make calls');
      return;
    }

    if (isMyChannel) {
      Alert.alert('Invalid Action', 'You cannot call your own channel');
      return;
    }

    try {
      setIsLoading('voice');
      
      // Navigate to TipCall screen with the channel owner's ID
      navigation.navigate('TipCallSimple', {
        recipientId: channelInfo.createdBy,
        recipientName: channelInfo.channelName,
        callType: 'voice',
      });
      
    } catch (error) {
      console.error('[ChannelCommunication] Error initiating voice call:', error);
      Alert.alert('Error', 'Failed to initiate voice call. Please try again.');
    } finally {
      setIsLoading(null);
    }
  }, [user?.id, isMyChannel, channelInfo, navigation]);

  // Handle video call
  const handleVideoCall = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to make video calls');
      return;
    }

    if (isMyChannel) {
      Alert.alert('Invalid Action', 'You cannot video call your own channel');
      return;
    }

    try {
      setIsLoading('video');
      
      // Navigate to TipCall screen with video call type
      navigation.navigate('TipCallSimple', {
        recipientId: channelInfo.createdBy,
        recipientName: channelInfo.channelName,
        callType: 'video',
      });
      
    } catch (error) {
      console.error('[ChannelCommunication] Error initiating video call:', error);
      Alert.alert('Error', 'Failed to initiate video call. Please try again.');
    } finally {
      setIsLoading(null);
    }
  }, [user?.id, isMyChannel, channelInfo, navigation]);

  // Handle chat
  const handleChat = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to start chatting');
      return;
    }

    if (isMyChannel) {
      Alert.alert('Invalid Action', 'You cannot chat with your own channel');
      return;
    }

    try {
      setIsLoading('chat');
      
      // Navigate to Chat screen
      navigation.navigate('Chat', {
        recipientId: channelInfo.createdBy,
        recipientName: channelInfo.channelName,
      });
      
    } catch (error) {
      console.error('[ChannelCommunication] Error opening chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    } finally {
      setIsLoading(null);
    }
  }, [user?.id, isMyChannel, channelInfo, navigation]);

  // Handle message/email
  const handleMessage = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to send messages');
      return;
    }

    if (isMyChannel) {
      Alert.alert('Invalid Action', 'You cannot message your own channel');
      return;
    }

    // For now, show a coming soon alert
    Alert.alert(
      'Coming Soon',
      'Direct messaging feature will be available soon!',
      [{ text: 'OK' }]
    );
  }, [user?.id, isMyChannel]);

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
            {isLoading === 'video' ? 'Connecting...' : 'Video Call'}
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

        {/* Message Button */}
        <TouchableOpacity
          style={[styles.communicationButton, styles.messageButton]}
          onPress={handleMessage}
          disabled={isLoading === 'message'}
          activeOpacity={0.8}
        >
          <Mail size={18} color={colors.text.primary} />
          <Text style={[styles.messageButtonText, { color: colors.text.primary }]}>
            Message
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
