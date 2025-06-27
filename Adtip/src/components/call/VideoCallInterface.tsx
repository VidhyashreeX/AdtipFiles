import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { 
  Mic, MicOff, Video, VideoOff, Phone, 
  RotateCcw, MessageSquare, MoreVertical 
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface VideoCallInterfaceProps {
  participants: any[];
  isGroupCall?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onFlipCamera: () => void;
  onOpenChat: () => void;
  onMoreOptions: () => void;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

const VideoParticipant = ({ participant, isLarge = false }: { participant: any; isLarge?: boolean }) => {
  return (
    <View style={[
      styles.participantContainer,
      isLarge ? styles.largeParticipant : styles.smallParticipant
    ]}>
      <View style={styles.participantVideo}>
        {/* Placeholder for video component */}
        <View style={styles.participantInitial}>
          <Text style={styles.initialText}>{participant.name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>
          {participant.isSelf ? 'You' : participant.name}
        </Text>
        {participant.micMuted && (
          <MicOff size={14} color="#fff" style={styles.mutedIcon} />
        )}
      </View>
    </View>
  );
};

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  participants,
  isGroupCall = false,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  onFlipCamera,
  onOpenChat,
  onMoreOptions,
  micEnabled,
  cameraEnabled,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Call indicator at top */}
      <View style={styles.topInfoBar}>
        <Text style={styles.encryptedText}>End-to-end encrypted call</Text>
      </View>
      
      {/* Participants grid */}
      <View style={styles.participantsGrid}>
        {isGroupCall ? (
          // Group call layout with multiple participants
          participants.map((participant, index) => (
            <VideoParticipant 
              key={participant.id} 
              participant={participant} 
              isLarge={index === 0} 
            />
          ))
        ) : (
          // 1-on-1 call layout
          <>
            {/* Main participant (remote) */}
            {participants.length > 0 && (
              <VideoParticipant 
                participant={participants.find(p => !p.isSelf) || participants[0]} 
                isLarge={true} 
              />
            )}
            
            {/* Self view (small) */}
            {participants.length > 1 && (
              <View style={styles.selfViewWrapper}>
                <VideoParticipant 
                  participant={participants.find(p => p.isSelf) || participants[1]} 
                />
              </View>
            )}
          </>
        )}
      </View>
      
      {/* Call controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onToggleCamera}
          >
            {cameraEnabled ? (
              <Video color="#fff" size={22} />
            ) : (
              <VideoOff color="#fff" size={22} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onToggleMic}
          >
            {micEnabled ? (
              <Mic color="#fff" size={22} />
            ) : (
              <MicOff color="#fff" size={22} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={onEndCall}
          >
            <Phone color="#fff" size={22} style={styles.endCallIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onFlipCamera}
          >
            <RotateCcw color="#fff" size={22} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onMoreOptions}
          >
            <MoreVertical color="#fff" size={22} />
          </TouchableOpacity>
        </View>
        
        {/* Chat button */}
        {isGroupCall && (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={onOpenChat}
          >
            <MessageSquare color="#fff" size={20} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topInfoBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  encryptedText: {
    color: '#fff',
    fontSize: 14,
  },
  participantsGrid: {
    flex: 1,
  },
  participantContainer: {
    overflow: 'hidden',
    backgroundColor: '#1F2C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeParticipant: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  smallParticipant: {
    width: '100%',
    height: '100%',
  },
  participantVideo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,168,132,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#00A884',
    fontSize: 40,
    fontWeight: '600',
  },
  participantInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  participantName: {
    color: '#fff',
    fontSize: 14,
  },
  mutedIcon: {
    marginLeft: 5,
  },
  selfViewWrapper: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B3B3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF4343',
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
  chatButton: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default VideoCallInterface;