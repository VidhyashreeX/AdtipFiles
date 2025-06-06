import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Vibration,
} from 'react-native';
import { Phone, Video, X } from 'lucide-react-native';

interface IncomingCallProps {
  callerName: string;
  callerImage?: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

const VIBRATION_PATTERN = [1000, 2000, 3000];

const IncomingCallScreen: React.FC<IncomingCallProps> = ({
  callerName,
  callerImage,
  callType,
  onAccept,
  onReject,
}) => {
  // Start vibration when call screen appears
  useEffect(() => {
    Vibration.vibrate(VIBRATION_PATTERN, true);
    return () => Vibration.cancel();
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={callerImage ? { uri: callerImage } : require('../../assets/images/default-avatar.png')}
        style={styles.backgroundImage}
        blurRadius={10}>
        <View style={styles.overlay}>
          <View style={styles.callerInfo}>
            <Text style={styles.callType}>
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </Text>
            <Text style={styles.callerName}>{callerName || 'Unknown'}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
              <X size={32} color="#fff" />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={onAccept}
            >
              {callType === 'video' ? (
                <Video size={32} color="#fff" />
              ) : (
                <Phone size={32} color="#fff" />
              )}
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'space-between',
    padding: 24,
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: 100,
  },
  callType: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 12,
  },
  callerName: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 50,
  },
  rejectButton: {
    backgroundColor: '#ff3b30',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#24d05a',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },
});

export default IncomingCallScreen;