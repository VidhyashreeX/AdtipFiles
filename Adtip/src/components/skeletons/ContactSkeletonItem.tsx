import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ContactSkeletonItem: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  
  const skeletonColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
        borderColor: isDarkMode ? colors.border : '#F1F3F4',
      }
    ]}>
      <View style={styles.content}>
        {/* Avatar Skeleton */}
        <View style={[styles.avatar, { backgroundColor: skeletonColor }]} />
        
        {/* Info Skeleton */}
        <View style={styles.info}>
          <View style={[styles.nameLine, { backgroundColor: skeletonColor }]} />
          <View style={[styles.statusLine, { backgroundColor: skeletonColor }]} />
          <View style={[styles.tagLine, { backgroundColor: skeletonColor }]} />
        </View>
        
        {/* Action Buttons Skeleton */}
        <View style={styles.actions}>
          <View style={[styles.actionButton, { backgroundColor: skeletonColor }]} />
          <View style={[styles.actionButton, { backgroundColor: skeletonColor }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  
  nameLine: {
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
    width: '60%',
  },
  
  statusLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
    width: '80%',
  },
  
  tagLine: {
    height: 10,
    borderRadius: 5,
    width: '70%',
  },
  
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

export default ContactSkeletonItem;