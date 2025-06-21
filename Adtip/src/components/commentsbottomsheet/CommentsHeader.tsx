import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CommentsHeaderProps {
  onClose: () => void;
  title?: string;
  commentCount?: number;
}

const CommentsHeader: React.FC<CommentsHeaderProps> = ({
  onClose,
  title = 'Comments',
  commentCount,
}) => {
  const { colors } = useTheme();
  const closeButtonScale = useSharedValue(1);

  const handleClosePress = () => {
    closeButtonScale.value = withSpring(0.9, { duration: 100 }, () => {
      closeButtonScale.value = withSpring(1, { duration: 100 });
    });
    onClose();
  };

  const closeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Drag Handle */}
      <View style={styles.dragHandleContainer}>
        <View style={[styles.dragHandle, { backgroundColor: colors.text.tertiary }]} />
      </View>

      {/* Header Content */}
      <View style={styles.headerContent}>
        {/* Title and Count */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {title}
          </Text>
          {commentCount !== undefined && (
            <Text style={[styles.commentCount, { color: colors.text.secondary }]}>
              {commentCount}
            </Text>
          )}
        </View>

        {/* Close Button */}
        <Animated.View style={closeButtonStyle}>
          <TouchableOpacity
            onPress={handleClosePress}
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  commentCount: {
    fontSize: 16,
    marginLeft: 8,
    color: '#666666',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentsHeader;