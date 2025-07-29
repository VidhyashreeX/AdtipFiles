import { useMutation } from '@tanstack/react-query';
import { ApiService } from '../services/ApiService';
import { logCall, logError } from '../utils/ProductionLogger';

export interface InitiateCallRequest {
  callerId: number;
  receiverId: number;
  callType: 'voice' | 'video';
  platform?: 'ANDROID' | 'IOS';
}

export interface InitiateCallResponse {
  success: boolean;
  message: string;
  data: {
    callId: number;
    sessionId: string;
    meetingId: string;
    token: string;
    channelName: string;
    maxDuration: number;
    maxDurationMinutes: number;
    callerInfo: { id: number; name: string };
    receiverInfo: { id: number; name: string };
    callType: string;
    platform: string;
    startTime: string;
    maxEndTime: string;
  };
}

/**
 * Hook for initiating calls with TanStack Query
 * Provides optimized performance and error handling
 */
export const useInitiateCall = () => {
  return useMutation<InitiateCallResponse, Error, InitiateCallRequest>({
    mutationFn: async (callData: InitiateCallRequest) => {
      logCall('useInitiateCall', 'Starting call initiation API request', callData);
      
      const response = await ApiService.initiateConsolidatedCall(callData);
      
      logCall('useInitiateCall', 'Call initiation API response received', {
        success: response.success,
        sessionId: response.data?.sessionId,
        meetingId: response.data?.meetingId
      });
      
      return response;
    },
    onSuccess: (data, variables) => {
      logCall('useInitiateCall', 'Call initiation successful', {
        sessionId: data.data.sessionId,
        callType: variables.callType,
        receiverId: variables.receiverId
      });
    },
    onError: (error, variables) => {
      logError('useInitiateCall', 'Call initiation failed', error, {
        callType: variables.callType,
        receiverId: variables.receiverId
      });
    },
    // Disable retries for call initiation to avoid duplicate calls
    retry: false,
    // Set a reasonable timeout
    networkMode: 'online',
  });
};

/**
 * Hook for ending calls
 */
export const useEndCall = () => {
  return useMutation<any, Error, { callId: number; reason?: string }>({
    mutationFn: async ({ callId, reason = 'user_ended' }) => {
      logCall('useEndCall', 'Ending call', { callId, reason });
      
      // Add your end call API here when available
      // const response = await ApiService.endCall(callId, reason);
      // return response;
      
      // For now, just log the action
      logCall('useEndCall', 'Call end requested', { callId, reason });
      return { success: true };
    },
    onSuccess: (data, variables) => {
      logCall('useEndCall', 'Call ended successfully', variables);
    },
    onError: (error, variables) => {
      logError('useEndCall', 'Failed to end call', error, variables);
    },
    retry: 1, // Allow one retry for end call
  });
};

/**
 * Hook for updating call status
 */
export const useUpdateCallStatus = () => {
  return useMutation<any, Error, { callId: number; status: string }>({
    mutationFn: async ({ callId, status }) => {
      logCall('useUpdateCallStatus', 'Updating call status', { callId, status });
      
      // Add your update call status API here when available
      // const response = await ApiService.updateCallStatus(callId, status);
      // return response;
      
      // For now, just log the action
      logCall('useUpdateCallStatus', 'Call status update requested', { callId, status });
      return { success: true };
    },
    onSuccess: (data, variables) => {
      logCall('useUpdateCallStatus', 'Call status updated successfully', variables);
    },
    onError: (error, variables) => {
      logError('useUpdateCallStatus', 'Failed to update call status', error, variables);
    },
    retry: 2, // Allow retries for status updates
  });
};
