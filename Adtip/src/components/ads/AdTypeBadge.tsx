/**
 * AdTypeBadge Component
 * 
 * Displays a colored badge indicating the ad type with icon and label.
 * Used in ad cards and ad viewing screens.
 * 
 * Features:
 * - Color-coded by ad type
 * - Icon + label
 * - Compact and Small sizes
 * - Consistent styling
 * 
 * @example
 * ```tsx
 * <AdTypeBadge adType={AdModelType.SKIP} size="default" />
 * <AdTypeBadge adType={AdModelType.NON_SKIP} size="small" />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { AdModelType, getAdTypeColor, getAdTypeBadge } from '../../types/ads';

interface AdTypeBadgeProps {
  adType: AdModelType;
  size?: 'small' | 'default';
  style?: any;
}

const AdTypeBadge: React.FC<AdTypeBadgeProps> = ({
  adType,
  size = 'default',
  style,
}) => {
  const color = getAdTypeColor(adType);
  const label = getAdTypeBadge(adType);
  
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <Text style={[styles.badgeText, isSmall && styles.badgeTextSmall]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default AdTypeBadge;
