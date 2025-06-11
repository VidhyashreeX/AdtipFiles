import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext';

const PostItemSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const skeletonBackgroundColor = isDarkMode ? colors.gray?.[800] || '#2C2C2E' : colors.gray?.[100] || '#F3F4F6';
  const skeletonHighlightColor = isDarkMode ? colors.gray?.[700] || '#3A3A3C' : colors.gray?.[50] || '#FAFAFA';

  return (
    <SkeletonPlaceholder backgroundColor={skeletonBackgroundColor} highlightColor={skeletonHighlightColor} speed={1000}>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar} />
          <View style={styles.userInfo}>
            <View style={styles.username} />
            <View style={styles.timeAgo} />
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionLine1} />
        <View style={styles.captionLine2} />

        {/* Media */}
        <View style={styles.media} />

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionButton} />
          <View style={styles.actionButton} />
          <View style={styles.actionButton} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    paddingBottom: 12, // To match PostItem's structure a bit
    // Elevation/shadow can be added if needed, but skeleton usually keeps it flat
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  timeAgo: {
    width: '30%',
    height: 10,
    borderRadius: 4,
  },
  captionLine1: {
    height: 12,
    width: '90%',
    borderRadius: 4,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  captionLine2: {
    height: 12,
    width: '70%',
    borderRadius: 4,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  media: {
    width: '100%',
    height: 250, // Approximate height for post media
    // borderRadius might be needed if your media has rounded corners
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  actionButton: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
});

export default PostItemSkeleton;