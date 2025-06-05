import React from 'react';
import { Text, StyleSheet } from 'react-native';
import LastSeenService from '../../services/LastSeenService';
import { useTheme } from '../../contexts/ThemeContext';

interface LastSeenProps {
  lastActiveTime: string | null;
  isOnline?: boolean;
  style?: object;
  showOnlineStatus?: boolean;
  format?: 'relative' | 'formatted';
}

const LastSeen: React.FC<LastSeenProps> = ({
  lastActiveTime,
  isOnline = false,
  style = {},
  showOnlineStatus = true,
  format = 'relative',
}) => {
  const { colors } = useTheme();
  
  // If user is online and we want to show online status, just show "Online"
  if (isOnline && showOnlineStatus) {
    return (
      <Text 
        style={[
          styles.text, 
          { color: colors.success },
          style
        ]}
      >
        Online
      </Text>
    );
  }
  
  // If user is offline, show last active time
  if (lastActiveTime) {
    const formattedTime = format === 'relative' 
      ? LastSeenService.getRelativeTime(lastActiveTime)
      : LastSeenService.formatLastSeen(lastActiveTime);
    
    return (
      <Text 
        style={[
          styles.text,
          { color: colors.text.tertiary },
          style
        ]}
      >
        {showOnlineStatus ? 'Last seen ' : ''}{formattedTime}
      </Text>
    );
  }
  
  // If no last active time is available
  return null;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default LastSeen;