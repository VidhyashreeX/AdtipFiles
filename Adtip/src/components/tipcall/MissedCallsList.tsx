import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Phone, Video, Clock } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import { formatDistanceToNow } from 'date-fns';

interface MissedCall {
  id: number;
  caller_id: number;
  receiver_id: number;
  call_type: string;
  created_at: string;
  caller_name?: string;
  caller_image?: string;
}

interface MissedCallsListProps {
  onCallUser?: (userId: number, callType: 'audio' | 'video') => void;
}

const MissedCallsList: React.FC<MissedCallsListProps> = ({ onCallUser }) => {
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMissedCalls = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getMissedCalls(user.id);
      if (response.status && response.data?.calls) {
        setMissedCalls(response.data.calls);
      } else {
        setError(response.message || 'Failed to fetch missed calls');
      }
    } catch (err) {
      setError('An error occurred while fetching missed calls');
      console.error('Error fetching missed calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissedCalls();
  }, [user]);

  const handleCallBack = (callerId: number, callType: string) => {
    if (onCallUser) {
      onCallUser(callerId, callType === 'video-call' ? 'video' : 'audio');
    }
  };

  const renderMissedCall = ({ item }: { item: MissedCall }) => {
    const isVideoCall = item.call_type === 'video-call';
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    
    return (
      <View style={styles.callItem}>
        <View style={styles.avatarContainer}>
          {item.caller_image ? (
            <Image 
              source={{ uri: item.caller_image }} 
              style={styles.avatar} 
              defaultSource={require('../../assets/images/default-avatar.png')}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>
                {item.caller_name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.callInfo}>
          <Text style={styles.callerName}>
            {item.caller_name || `Caller ${item.caller_id}`}
          </Text>
          <View style={styles.callDetails}>
            {isVideoCall ? (
              <Video size={16} color="#666" />
            ) : (
              <Phone size={16} color="#666" />
            )}
            <Text style={styles.callTypeText}>
              Missed {isVideoCall ? 'video' : 'audio'} call
            </Text>
            <Clock size={14} color="#999" />
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.callBackButton, 
            { backgroundColor: isVideoCall ? '#4e54c8' : '#4CAF50' }
          ]}
          onPress={() => handleCallBack(item.caller_id, item.call_type)}
        >
          {isVideoCall ? (
            <Video size={20} color="#fff" />
          ) : (
            <Phone size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4e54c8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (missedCalls.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No missed calls</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={missedCalls}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderMissedCall}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  callInfo: {
    flex: 1,
  },
  callerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  callBackButton: {
    padding: 10,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MissedCallsList;
