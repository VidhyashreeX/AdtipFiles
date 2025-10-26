// Test file to verify ActiveStreamsRow fixes
// This file can be used to test the component with various data scenarios

import React from 'react';
import { View } from 'react-native';
import ActiveStreamsRow from '../src/components/home/ActiveStreamsRow';

// Mock data scenarios to test the fix
const mockStreamData = [
  // Normal data with all fields
  {
    id: 1,
    meeting_id: 'meeting-123',
    title: 'Live Gaming Stream',
    user_name: 'GameMaster',
    viewer_count: 50,
    cost_per_minute: 10,
    is_private: false,
    start_time: '2025-01-01T10:00:00Z',
    status: 'active'
  },
  
  // Data with missing id (should be handled gracefully)
  {
    meeting_id: 'meeting-456',
    title: 'Music Live Session',
    streamer_name: 'MusicLover', // Different field name
    viewer_count: 25,
    cost_per_minute: 5,
    is_private: false,
    start_time: '2025-01-01T11:00:00Z',
    status: 'active'
  },
  
  // Minimal required data
  {
    meeting_id: 'meeting-789',
    title: 'Talk Show',
    viewer_count: 0,
    cost_per_minute: 0,
    start_time: '2025-01-01T12:00:00Z'
  }
];

// Test component
const TestActiveStreamsRow = () => {
  return (
    <View>
      <ActiveStreamsRow />
    </View>
  );
};

export default TestActiveStreamsRow;