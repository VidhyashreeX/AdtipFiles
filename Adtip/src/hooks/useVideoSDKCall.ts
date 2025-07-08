import { useState, useCallback } from 'react';
import ApiService from '../services/ApiService';

export interface VideoSDKCallBalance {
  wallet_balance: number;
  subscription_status: {
    hasActiveSubscription: boolean;
    planName: string;
    amount: number;
    isPremium: boolean;
  };
  charge_per_minute: number;
  max_call_minutes: number;
  has_active_subscription: boolean;
}

export interface VideoSDKCallHistory {
  call_id: number;
  caller_user_id: number;
  receiver_user_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  call_type: string;
  caller_name: string;
  receiver_name: string;
}

export interface VideoSDKCallHistoryResponse {
  calls: VideoSDKCallHistory[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_records: number;
    limit: number;
  };
}

export const useVoiceCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start a voice call
  const startCall = useCallback(async (callerId: number, receiverId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.initiateVoiceCall({
        callerId,
        receiverId,
        action: 'start'
      });
      
      if (response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to start call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // End a voice call
  const endCall = useCallback(async (callerId: number, receiverId: number, callId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.initiateVoiceCall({
        callerId,
        receiverId,
        action: 'end',
        callId
      });
      
      if (response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to end call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end call';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Record a missed voice call
  const missedCall = useCallback(async (callerId: number, receiverId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.initiateVoiceCall({
        callerId,
        receiverId,
        action: 'missed'
      });
      
      if (response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to record missed call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record missed call';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user's call balance and subscription status
  const getCallBalance = useCallback(async (userId: number): Promise<VideoSDKCallBalance> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getVoiceCallBalance(userId);
      
      if (response.status) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get call balance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get call balance';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user's call history
  const getCallHistory = useCallback(async (
    userId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<VideoSDKCallHistoryResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getVoiceCallHistory(userId, page, limit);
      
      if (response.status) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get call history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get call history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    startCall,
    endCall,
    missedCall,
    getCallBalance,
    getCallHistory,
    clearError: () => setError(null)
  };
};

export const useVideoCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start a video call
  const startCall = useCallback(async (callerId: number, receiverId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.initiateVideoCall({
        callerId,
        receiverId,
        action: 'start'
      });
      
      if (response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to start video call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start video call';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // End a video call
  const endCall = useCallback(async (callerId: number, receiverId: number, callId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.initiateVideoCall({
        callerId,
        receiverId,
        action: 'end',
        callId
      });
      
      if (response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to end video call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end video call';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Record a missed video call
  const missedCall = useCallback(async (callerId: number, receiverId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.initiateVideoCall({
        callerId,
        receiverId,
        action: 'missed'
      });
      
      if (response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to record missed video call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record missed video call';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user's video call balance and subscription status
  const getCallBalance = useCallback(async (userId: number): Promise<VideoSDKCallBalance> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getVideoCallBalance(userId);
      
      if (response.status) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get video call balance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get video call balance';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user's video call history
  const getCallHistory = useCallback(async (
    userId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<VideoSDKCallHistoryResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getVideoCallHistory(userId, page, limit);
      
      if (response.status) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get video call history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get video call history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    startCall,
    endCall,
    missedCall,
    getCallBalance,
    getCallHistory,
    clearError: () => setError(null)
  };
}; 