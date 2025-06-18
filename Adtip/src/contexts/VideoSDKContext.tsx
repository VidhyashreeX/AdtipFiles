import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import VideoSDKService, { VideoSDKConfig, MeetingConfig } from '../services/videosdk/VideoSDKService';

interface VideoSDKContextType {
  isVideoSDKReady: boolean;
  createMeeting: (token: string) => Promise<string | null>;
  validateMeeting: (meetingId: string, token: string) => Promise<boolean>;
  createMeetingConfig: (
    meetingId: string,
    token: string,
    participantName: string,
    options?: { micEnabled?: boolean; webcamEnabled?: boolean }
  ) => MeetingConfig;
  updateConfig: (config: Partial<VideoSDKConfig>) => void;
  getConfig: () => VideoSDKConfig;
}

const VideoSDKContext = createContext<VideoSDKContextType | undefined>(undefined);

interface VideoSDKProviderProps {
  children: ReactNode;
  config?: VideoSDKConfig;
}

export const VideoSDKProvider: React.FC<VideoSDKProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const [isVideoSDKReady, setIsVideoSDKReady] = useState(false);
  const videoSDKService = VideoSDKService.getInstance();

  useEffect(() => {
    const initializeVideoSDK = async () => {
      console.log('[VideoSDKContext] Initializing VideoSDK...');
      const success = await videoSDKService.initialize(config);
      setIsVideoSDKReady(success);
      
      if (success) {
        console.log('[VideoSDKContext] VideoSDK initialized successfully');
      } else {
        console.warn('[VideoSDKContext] VideoSDK initialization failed');
      }
    };

    initializeVideoSDK();
  }, []);

  const createMeeting = async (token: string): Promise<string | null> => {
    return await videoSDKService.createMeeting(token);
  };

  const validateMeeting = async (meetingId: string, token: string): Promise<boolean> => {
    return await videoSDKService.validateMeeting(meetingId, token);
  };

  const createMeetingConfig = (
    meetingId: string,
    token: string,
    participantName: string,
    options?: { micEnabled?: boolean; webcamEnabled?: boolean }
  ): MeetingConfig => {
    return videoSDKService.createMeetingConfig(meetingId, token, participantName, options);
  };

  const updateConfig = (newConfig: Partial<VideoSDKConfig>): void => {
    videoSDKService.updateConfig(newConfig);
  };

  const getConfig = (): VideoSDKConfig => {
    return videoSDKService.getConfig();
  };

  const contextValue: VideoSDKContextType = {
    isVideoSDKReady,
    createMeeting,
    validateMeeting,
    createMeetingConfig,
    updateConfig,
    getConfig,
  };

  return (
    <VideoSDKContext.Provider value={contextValue}>
      {children}
    </VideoSDKContext.Provider>
  );
};

export const useVideoSDK = (): VideoSDKContextType => {
  const context = useContext(VideoSDKContext);
  if (context === undefined) {
    throw new Error('useVideoSDK must be used within a VideoSDKProvider');
  }
  return context;
};