import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { X, TrendingDown, TrendingUp, Phone, Video, Clock, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CallSettlementData {
  callId: string;
  callType: 'voice' | 'video';
  callDuration: number;
  caller: {
    userId: string;
    debitAmount: number;
    newBalance: number;
    previousBalance: number;
  };
  receiver: {
    userId: string;
    creditAmount: number;
    newBalance: number;
    previousBalance: number;
  };
  settlementTime: string;
  status: string;
}

interface CallSettlementModalProps {
  visible: boolean;
  onClose: () => void;
  settlementData: CallSettlementData | null;
  currentUserId: string;
  otherUserName?: string;
  otherUserId?: string;
}

const CallSettlementModal: React.FC<CallSettlementModalProps> = ({
  visible,
  onClose,
  settlementData,
  currentUserId,
  otherUserName = 'Unknown User',
  otherUserId,
}) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!settlementData) return null;

  // Determine if current user is caller or receiver
  const isCurrentUserCaller = settlementData.caller.userId === currentUserId;
  const userTransaction = isCurrentUserCaller ? settlementData.caller : settlementData.receiver;
  const amount = isCurrentUserCaller ? userTransaction.debitAmount : userTransaction.creditAmount;

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get modal content based on user role
  const getModalContent = () => {
    if (isCurrentUserCaller) {
      return {
        title: 'Call Completed',
        subtitle: `₹${amount.toFixed(2)} charged for ${settlementData.callType} call`,
        icon: TrendingDown,
        iconColor: '#FF6B6B',
        gradientColors: isDarkMode 
          ? ['#2D1B1B', '#3D2626', '#4D3131'] 
          : ['#FFE5E5', '#FFCCCC', '#FFB3B3'],
        textColor: '#FF6B6B',
        actionText: 'Charged',
      };
    } else {
      return {
        title: 'Call Completed',
        subtitle: `₹${amount.toFixed(2)} earned from ${settlementData.callType} call`,
        icon: TrendingUp,
        iconColor: '#4ECDC4',
        gradientColors: isDarkMode 
          ? ['#1B2D2A', '#263D37', '#314D44'] 
          : ['#E5F9F6', '#CCFFF2', '#B3FFED'],
        textColor: '#4ECDC4',
        actionText: 'Earned',
      };
    }
  };

  const modalContent = getModalContent();
  const IconComponent = modalContent.icon;
  const CallTypeIcon = settlementData.callType === 'video' ? Video : Phone;

  const styles = createStyles(colors, isDarkMode, modalContent);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={modalContent.gradientColors}
            style={styles.modalCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Header with Icon */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: modalContent.iconColor }]}>
                <IconComponent size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {modalContent.title}
              </Text>
              <Text style={[styles.subtitle, { color: modalContent.textColor }]}>
                {modalContent.subtitle}
              </Text>
            </View>

            {/* Call Details */}
            <View style={styles.detailsContainer}>
              {/* Other User Info */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <User size={16} color={colors.text.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    {isCurrentUserCaller ? 'Called' : 'Call from'}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {otherUserName}
                  </Text>
                </View>
              </View>

              {/* Call Type */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <CallTypeIcon size={16} color={colors.text.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    Call Type
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {settlementData.callType.charAt(0).toUpperCase() + settlementData.callType.slice(1)} Call
                  </Text>
                </View>
              </View>

              {/* Duration */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock size={16} color={colors.text.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    Duration
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {formatDuration(settlementData.callDuration)}
                  </Text>
                </View>
              </View>

              {/* Balance Update */}
              <View style={styles.balanceContainer}>
                <Text style={[styles.balanceLabel, { color: colors.text.secondary }]}>
                  Wallet Balance
                </Text>
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceAmount, { color: modalContent.textColor }]}>
                    ₹{userTransaction.newBalance.toFixed(2)}
                  </Text>
                  <Text style={[styles.balanceChange, { color: colors.text.secondary }]}>
                    (₹{amount.toFixed(2)} {modalContent.actionText.toLowerCase()})
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Got it</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean, modalContent: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: SCREEN_WIDTH * 0.9,
      maxWidth: 400,
    },
    modalCard: {
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 1,
      padding: 4,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    detailsContainer: {
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    detailIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background + '40',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '600',
    },
    balanceContainer: {
      marginTop: 8,
      padding: 16,
      backgroundColor: colors.background + '20',
      borderRadius: 12,
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    balanceAmount: {
      fontSize: 20,
      fontWeight: '700',
      marginRight: 8,
    },
    balanceChange: {
      fontSize: 14,
      fontWeight: '500',
    },
    actionButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default CallSettlementModal;
