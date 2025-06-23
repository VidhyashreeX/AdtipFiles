import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Phone, PhoneOff, Video, VideoOff } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface IncomingCallOverlayProps {
  callerName: string;
  callType: 'voice' | 'video';
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
  callerName,
  callType,
  callerAvatar,
  onAccept,
  onDecline,
}) => {  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      
      {/* Background with gradient */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.backgroundGradient}
      >
        <View style={styles.overlay}>
          
          {/* Top section with caller info */}
          <View style={styles.topSection}>
            <Text style={styles.incomingCallText}>
              Incoming {callType === 'video' ? 'video' : 'voice'} call
            </Text>
            
            {/* Caller Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {callerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            
            {/* Caller Name */}
            <Text style={styles.callerNameText}>{callerName}</Text>
            
            {/* Call Status */}
            <Text style={styles.callStatusText}>
              {callType === 'video' ? 'wants to video chat' : 'is calling you'}
            </Text>
          </View>

          {/* Bottom section with action buttons */}
          <View style={styles.bottomSection}>
            <View style={styles.actionsContainer}>
              
              {/* Decline Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={onDecline}
                activeOpacity={0.8}
              >
                <PhoneOff size={28} color="#ffffff" />
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={onAccept}
                activeOpacity={0.8}
              >
                {callType === 'video' ? (
                  <Video size={28} color="#ffffff" />
                ) : (
                  <Phone size={28} color="#ffffff" />
                )}
              </TouchableOpacity>
              
            </View>

            {/* Action Labels */}
            <View style={styles.labelsContainer}>
              <Text style={styles.actionLabel}>Decline</Text>
              <Text style={styles.actionLabel}>Accept</Text>
            </View>
          </View>
          
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backgroundGradient: {
    flex: 1,
    width,
    height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  incomingCallText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  callerNameText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  callStatusText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#30D158',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  actionLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default IncomingCallOverlay;
