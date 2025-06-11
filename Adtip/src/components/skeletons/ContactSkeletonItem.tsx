import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from './SkeletonPlaceholder'; // Correctly import SkeletonPlaceholder
import { useTheme } from '../../contexts/ThemeContext'; // Ensure this path is correct

const ContactSkeletonItem: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  // Define a base color for the skeleton shapes themselves, the shimmer will overlay this
  const shapeBackgroundColor = isDarkMode ? colors.gray?.[600] || 'rgba(255,255,255,0.15)' : colors.gray?.[300] || 'rgba(0,0,0,0.1)';

  return (
    <View>
      <View style={[styles.contactItemCard, { backgroundColor: colors.card || (isDarkMode ? '#2C2C2E' : '#FFFFFF') }]}>
        <View style={styles.contactInfo}>
          <View style={[styles.skeletonName, { backgroundColor: shapeBackgroundColor }]} />
          <View style={[styles.skeletonStatus, { backgroundColor: shapeBackgroundColor }]} />
        </View>
        <View style={styles.callButtons}>
          <View style={[styles.skeletonButton, { backgroundColor: shapeBackgroundColor }]} />
          <View style={[styles.skeletonButton, { backgroundColor: shapeBackgroundColor }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contactItemCard: { // This is the overall card that will shimmer
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    height: 78,
    marginBottom: 8,
    borderRadius: 8,
    borderBottomWidth: 1, // If you want a border on the card itself
    // borderBottomColor: colors.borderLight, // Apply if needed, ensure colors is available or pass from theme
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'column',
    // backgroundColor: 'transparent', // Ensure children backgrounds are visible
  },
  skeletonName: {
    width: '70%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStatus: {
    width: '50%',
    height: 14,
    borderRadius: 4,
  },
  callButtons: {
    flexDirection: 'row',
    marginLeft: 16,
    // backgroundColor: 'transparent',
  },
  skeletonButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
  },
});

export default ContactSkeletonItem;