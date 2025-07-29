import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { ParticipantView } from '@videosdk.live/react-native-sdk';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WhatsAppStyleVideoLayoutProps {
  localParticipantId: string;
  remoteParticipantId: string;
  localWebcamOn: boolean;
  remoteWebcamOn: boolean;
}

const WhatsAppStyleVideoLayout: React.FC<WhatsAppStyleVideoLayoutProps> = ({
  localParticipantId,
  remoteParticipantId,
  localWebcamOn,
  remoteWebcamOn,
}) => {
  // Local video position state
  const [localVideoPosition, setLocalVideoPosition] = useState({
    x: screenWidth - 140, // Default to top-right
    y: 80,
  });

  // Animation values for dragging
  const translateX = useRef(new Animated.Value(localVideoPosition.x)).current;
  const translateY = useRef(new Animated.Value(localVideoPosition.y)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Local video dimensions
  const LOCAL_VIDEO_WIDTH = 120;
  const LOCAL_VIDEO_HEIGHT = 180;
  const EDGE_MARGIN = 20;

  // Handle pan gesture for dragging local video
  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Scale up slightly when dragging starts
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: false,
      }).start();
    } else if (event.nativeEvent.state === State.END) {
      // Scale back to normal
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
      }).start();

      // Snap to edges
      const { translationX, translationY } = event.nativeEvent;
      let newX = localVideoPosition.x + translationX;
      let newY = localVideoPosition.y + translationY;

      // Constrain to screen bounds
      newX = Math.max(EDGE_MARGIN, Math.min(screenWidth - LOCAL_VIDEO_WIDTH - EDGE_MARGIN, newX));
      newY = Math.max(EDGE_MARGIN, Math.min(screenHeight - LOCAL_VIDEO_HEIGHT - EDGE_MARGIN, newY));

      // Snap to nearest edge (left or right)
      if (newX < screenWidth / 2) {
        newX = EDGE_MARGIN; // Snap to left
      } else {
        newX = screenWidth - LOCAL_VIDEO_WIDTH - EDGE_MARGIN; // Snap to right
      }

      // Update position state
      setLocalVideoPosition({ x: newX, y: newY });

      // Animate to final position
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: newX,
          useNativeDriver: false,
        }),
        Animated.spring(translateY, {
          toValue: newY,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // Handle tap to switch positions (swap local and remote)
  const handleLocalVideoTap = () => {
    // TODO: Implement position swap functionality
    console.log('Local video tapped - could implement position swap');
  };

  return (
    <View style={styles.container}>
      {/* Remote participant (full screen background) */}
      <View style={styles.remoteVideoContainer}>
        {remoteWebcamOn && remoteParticipantId ? (
          <ParticipantView
            participantId={remoteParticipantId}
            style={styles.remoteVideo}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            {/* Placeholder for remote video when camera is off or no participant */}
          </View>
        )}
      </View>

      {/* Local participant (draggable overlay) */}
      {localWebcamOn && localParticipantId && (
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.localVideoContainer,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.localVideoTouchable}
              onPress={handleLocalVideoTap}
              activeOpacity={0.8}
            >
              <ParticipantView
                participantId={localParticipantId}
                style={styles.localVideo}
              />
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1F2C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    width: 120,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideoTouchable: {
    flex: 1,
  },
  localVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default WhatsAppStyleVideoLayout;
