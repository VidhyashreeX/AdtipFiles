/**
 * AdCard Component
 * 
 * Displays an ad as a card in a list with thumbnail, campaign info, payout amount,
 * and ad type badge. Used in the Watch to Earn screen ad list.
 * 
 * Features:
 * - Thumbnail image with fallback
 * - Campaign name and description
 * - Payout amount prominently displayed
 * - Ad type badge with color coding
 * - "Watch Now" button
 * - Press animation
 * 
 * @example
 * ```tsx
 * <AdCard
 *   ad={adItem}
 *   onPress={() => handleAdPress(adItem.AD_ID)}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  getAdModelType, 
  getAdTypeColor, 
  getAdTypeBadge,
  formatPayout,
  AD_MODEL_CONFIGS,
  AdModelType
} from '../../types/ads';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);

interface Ad {
  AD_ID: number;
  AD_MODEL_ID: number;
  CAMPAIGN_NAME: string;
  campaign_name?: string;
  DESCRIPTION: string | null;
  AD_FILE_URL: string | null;
  ad_media_url?: string | null;
  adType?: AdModelType;
}

interface AdCardProps {
  ad: Ad;
  onPress: () => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, onPress }) => {
  const adType = ad.adType || getAdModelType(ad.AD_MODEL_ID);
  const adConfig = AD_MODEL_CONFIGS[adType];
  const adTypeColor = getAdTypeColor(adType);
  const adTypeBadge = getAdTypeBadge(adType);
  
  const campaignName = ad.campaign_name || ad.CAMPAIGN_NAME;
  const mediaUrl = ad.ad_media_url || ad.AD_FILE_URL;
  const description = ad.DESCRIPTION;

  // Calculate total potential earning
  const basePayout = adConfig.basePayout;
  const bonusPayout = adConfig.websiteVisitBonus || 0;
  const totalPayout = basePayout + bonusPayout;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <FastImage
          source={{
            uri: mediaUrl || 'https://via.placeholder.com/400x225',
            priority: FastImage.priority.normal,
          }}
          style={styles.thumbnail}
          resizeMode={FastImage.resizeMode.cover}
        />
        
        {/* Ad Type Badge */}
        <View style={[styles.badge, { backgroundColor: adTypeColor }]}>
          <Text style={styles.badgeText}>{adTypeBadge}</Text>
        </View>

        {/* Play Icon Overlay */}
        <View style={styles.playOverlay}>
          <Icon name="play-circle-filled" size={48} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Campaign Name */}
        <Text style={styles.campaignName} numberOfLines={2}>
          {campaignName}
        </Text>

        {/* Description */}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Info Row */}
        <View style={styles.infoRow}>
          {/* Watch Time */}
          <View style={styles.infoItem}>
            <Icon name="schedule" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {adConfig.requiredWatchTime}s
            </Text>
          </View>

          {/* Skip Info */}
          {adConfig.skipAllowed && (
            <View style={styles.infoItem}>
              <Icon name="skip-next" size={16} color="#F59E0B" />
              <Text style={styles.infoText}>
                Skip after {adConfig.skipAvailableAfter}s
              </Text>
            </View>
          )}

          {/* Bonus Info */}
          {bonusPayout > 0 && (
            <View style={styles.infoItem}>
              <Icon name="stars" size={16} color="#F59E0B" />
              <Text style={styles.infoText}>
                +₹{bonusPayout.toFixed(2)} bonus
              </Text>
            </View>
          )}
        </View>

        {/* Payout and CTA */}
        <View style={styles.footer}>
          {/* Payout */}
          <View style={styles.payoutContainer}>
            <Icon name="account-balance-wallet" size={20} color="#10B981" />
            <Text style={styles.payoutAmount}>
              {formatPayout(totalPayout)}
            </Text>
            {bonusPayout > 0 && (
              <Text style={styles.payoutBase}>
                (Base: {formatPayout(basePayout)})
              </Text>
            )}
          </View>

          {/* Watch Now Button */}
          <TouchableOpacity
            style={styles.watchButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.watchButtonText}>Watch Now</Text>
            <Icon name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    marginVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  thumbnailContainer: {
    width: '100%',
    height: (CARD_WIDTH * 9) / 16, // 16:9 aspect ratio
    position: 'relative',
    backgroundColor: '#111827',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    padding: 16,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payoutAmount: {
    marginLeft: 6,
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  payoutBase: {
    marginLeft: 6,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  watchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AdCard;
