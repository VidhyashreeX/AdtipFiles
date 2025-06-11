import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext'; // Ensure this path is correct for your project

const ContactSkeletonItem: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  // Ensure colors.gray[700] and colors.gray[200] exist in your theme
  const placeholderColor = isDarkMode ? (colors.gray && colors.gray[700] || 'rgba(255,255,255,0.2)') : (colors.gray && colors.gray[200] || 'rgba(0,0,0,0.1)');

  return (
    <View style={[styles.contactItem, { backgroundColor: colors.card || (isDarkMode ? '#333' : '#fff') }]}>
      <SkeletonPlaceholder>
        <View style={styles.contactInfo}>
          <View style={[styles.skeletonName, { backgroundColor: placeholderColor }]} />
          <View style={[styles.skeletonStatus, { backgroundColor: placeholderColor }]} />
        </View>
        <View style={styles.callButtons}>
          <View style={[styles.skeletonButton, { backgroundColor: placeholderColor }]} />
          <View style={[styles.skeletonButton, { backgroundColor: placeholderColor }]} />
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    // borderBottomColor will be themed by colors.borderLight in TipCallScreen or here if needed
    height: 78, // Approximate height of a contact item
    marginBottom: 8,
    borderRadius: 8,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'column',
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
  },
  skeletonButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
  },
});

export default ContactSkeletonItem;