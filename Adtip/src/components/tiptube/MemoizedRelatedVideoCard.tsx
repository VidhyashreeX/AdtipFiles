import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from '../../screens/tiptube/TipTubeScreen'; // Adjust path if Video interface is moved
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path

interface MemoizedRelatedVideoCardProps {
  item: Video;
  onPress: (video: Video) => void;
  // Pass relevant style objects if they are dynamic based on theme, or useTheme inside
}

const MemoizedRelatedVideoCard: React.FC<MemoizedRelatedVideoCardProps> = ({ item, onPress }) => {
  const { colors, isDarkMode } = useTheme(); // Or pass styles as props if preferred

  // Recreate styles or use passed styles. For simplicity, defining inline based on theme.
  // It's better to pass styles from TipTubeScreen if they are complex and already defined there.
  const cardStyle = {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: 'hidden',
  };
  const thumbnailStyle = {
    width: 120,
    height: 67, // approx 16:9
    backgroundColor: colors.border,
  };
  const contentStyle = {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  };
  const titleStyle = {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  };
  const creatorStyle = {
    fontSize: 12,
    color: colors.text.secondary,
  };
  const statsStyle = {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  };


  return (
    <TouchableOpacity style={cardStyle} onPress={() => onPress(item)}>
      <Image 
        source={{ uri: item.thumbnail || "https://via.placeholder.com/120x67.png?text=N/A" }} 
        style={thumbnailStyle} 
        resizeMode="cover" 
      />
      <View style={contentStyle}>
        <Text style={titleStyle} numberOfLines={2}>{item.title}</Text>
        <Text style={creatorStyle}>{item.creatorName}</Text>
        <Text style={statsStyle}>{(item.views || 0).toLocaleString()} views • {item.posted}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Custom comparison function if needed, for simple props like item.id, default shallow compare is often fine.
// const areEqual = (prevProps, nextProps) => {
//   return prevProps.item.id === nextProps.item.id && prevProps.item.title === nextProps.item.title /* && other relevant props */;
// };

export default React.memo(MemoizedRelatedVideoCard);