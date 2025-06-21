import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MeetingProvider } from '@videosdk.live/react-native-sdk';

import { useTheme } from '../../contexts/ThemeContext';
import { useVideoSDKMeeting } from '../../hooks/videosdk/useVideoSDKMeeting';
import { 
  VideoSDKParticipantView, 
  VideoSDKControlsBar, 
  VideoSDKCallTimer 
} from '../../components/videosdk';
import CallService from '../../services/CallService';

interface MeetingScreenParams {
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  displayName: string;
  isInitiator?: boolean;
  recipientName?: string;
}

const MeetingScreenContent: React.FC<MeetingScreenParams> = ({
  meetingId,
  token,
  callType,
  displayName,
  isInitiator = false,
  recipientName,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [showControls, setShowControls] = useState(true);

  const {
    participants,
    localParticipant,
    callStatus,
    callSettings,
    metrics,
    join,
    leave,
    toggleMic,
    toggleWebcam,
    toggleSpeaker,
  } = useVideoSDKMeeting({
    onMeetingJoined: () => {
      console.log('[MeetingScreen] Successfully joined meeting');
    },
    onMeetingLeft: () => {
      console.log('[MeetingScreen] Left meeting, ending call via CallService and navigating back');
      CallService.getInstance().endCurrentCall();
    },
    onError: (error) => {
      console.error('[MeetingScreen] Meeting error:', error);
      Alert.alert('Call Error', 'Failed to connect to the call. Please try again.');
      navigation.goBack();
    },
  });

  const styles = createMeetingStyles(colors, isDarkMode);

  // Auto-join when component mounts
  useEffect(() => {
    const joinMeeting = async () => {
      try {
        console.log('[MeetingScreen] Joining meeting:', meetingId);
        join();
      } catch (error) {
        console.error('[MeetingScreen] Failed to join meeting:', error);
        Alert.alert('Connection Error', 'Unable to join the call.');
        navigation.goBack();
      }
    };

    joinMeeting();
  }, []);

  // Toggle controls visibility
  const toggleControlsVisibility = () => {
    setShowControls(!showControls);
  };

  // Handle end call
  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: () => {
            leave();
            navigation.navigate('TipCall' as never);
          }
        },
      ]
    );
  };

  // Get participant array
  const participantArray = Array.from(participants.values());
  const remoteParticipants = participantArray.filter(p => p.id !== localParticipant?.id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.participantName}>
            {remoteParticipants.length > 0 ? remoteParticipants[0].displayName : recipientName || 'Connecting...'}
          </Text>
          <Text style={styles.callStatus}>
            {callStatus === 'connecting' ? 'Connecting...' : 
             callStatus === 'connected' ? 'Connected' : callStatus}
          </Text>
        </View>
        <VideoSDKCallTimer duration={metrics.duration} />
      </View>

      {/* Main Content */}
      <TouchableOpacity 
        style={styles.mainContent} 
        activeOpacity={1} 
        onPress={toggleControlsVisibility}
      >
        {callType === 'video' ? (
          <View style={styles.videoContainer}>
            {/* Remote participants */}
            {remoteParticipants.map((participant) => (
              <VideoSDKParticipantView
                key={participant.id}
                participant={participant}
                isLocal={false}
                style={styles.remoteVideo}
              />
            ))}
            
            {/* Local participant (small preview) */}
            {localParticipant && callSettings.webcamEnabled && (
              <View style={styles.localVideoContainer}>
                <VideoSDKParticipantView
                  participant={localParticipant}
                  isLocal={true}
                  style={styles.localVideo}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.voiceCallContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(remoteParticipants[0]?.displayName || recipientName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls */}
      {showControls && (
        <VideoSDKControlsBar
          callType={callType}
          callSettings={callSettings}
          onToggleMic={toggleMic}
          onToggleWebcam={toggleWebcam}
          onToggleSpeaker={toggleSpeaker}
          onEndCall={handleEndCall}
          participantCount={metrics.participantCount}
        />
      )}
    </SafeAreaView>
  );
};

const MeetingScreen: React.FC = () => {
  const route = useRoute();
  const params = route.params as MeetingScreenParams;

  if (!params?.meetingId || !params?.token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid meeting parameters</Text>
      </View>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: params.meetingId,
        micEnabled: true,
        webcamEnabled: params.callType === 'video',
        name: params.displayName,
      }}
      token={params.token}
    >
      <MeetingScreenContent {...params} />
    </MeetingProvider>
  );
};

const createMeetingStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 14,
    color: '#cccccc',
  },
  mainContent: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  localVideo: {
    flex: 1,
  },
  voiceCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default MeetingScreen;