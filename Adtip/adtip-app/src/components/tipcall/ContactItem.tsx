import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { PhoneCall, Video } from 'lucide-react-native';

interface ContactItemProps {
  name: string;
  image?: string;
  status: 'online' | 'offline' | 'busy';
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

export function ContactItem({
  name,
  image,
  status,
  onVoiceCall,
  onVideoCall,
}: ContactItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={[
            styles.statusIndicator, 
            status === 'online' ? styles.statusOnline : 
            status === 'busy' ? styles.statusBusy : 
            styles.statusOffline
          ]} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.statusText}>
            {status === 'online' ? 'Online' : 
             status === 'busy' ? 'Busy' : 
             'Offline'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.callButton} 
          onPress={onVoiceCall}
        >
          <PhoneCall size={20} color="#22c55e" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.videoButton} 
          onPress={onVideoCall}
        >
          <Video size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  statusOnline: {
    backgroundColor: '#22c55e',
  },
  statusOffline: {
    backgroundColor: '#9ca3af',
  },
  statusBusy: {
    backgroundColor: '#ef4444',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusText: {
    fontSize: 13,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  videoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});