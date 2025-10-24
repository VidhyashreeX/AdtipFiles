import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Crown } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { isPremiumUser } from '../../utils/userDataUtils';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  size = 'medium',
  style 
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isPremium = isPremiumUser(user);

  if (!isPremium) return null;

  const iconSize = size === 'small' ? 10 : size === 'medium' ? 12 : 16;
  const fontSize = size === 'small' ? 9 : size === 'medium' ? 10 : 12;
  const padding = size === 'small' ? 4 : size === 'medium' ? 6 : 8;

  return (
    <View style={[
      styles.badge, 
      { 
        backgroundColor: '#00C853',
        paddingHorizontal: padding,
        paddingVertical: padding / 2,
      },
      style
    ]}>
      <Crown size={iconSize} color="white" />
      <Text style={[styles.text, { fontSize }]}>Premium</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
