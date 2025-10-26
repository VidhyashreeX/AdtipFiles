/**
 * VideoBannerAd - Banner ad component for video content
 * Displays companion banner ads with click tracking
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import ApiService, { VideoAdResponse } from '../../services/ApiService';

interface VideoBannerAdProps {
  adData: VideoAdResponse | null;
}

const VideoBannerAd: React.FC<VideoBannerAdProps> = ({ adData }) => {
  const impressionTracked = useRef(false);

  useEffect(() => {
    // Track impression once when banner is displayed
    if (adData && adData.companionBanner && !impressionTracked.current) {
      impressionTracked.current = true;
      ApiService.trackAdEvent(adData.trackingUrls.impression);
    }

    // Reset flag when ad changes
    return () => {
      impressionTracked.current = false;
    };
  }, [adData]);

  // Don't render if no ad data or no companion banner
  if (!adData || !adData.companionBanner) {
    return null;
  }

  const handleBannerClick = async () => {
    try {
      // Track click event
      ApiService.trackAdEvent(adData.trackingUrls.click);

      // Open advertiser URL
      const url = adData.companionBanner?.clickThroughUrl;
      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.error('[VideoBannerAd] Cannot open URL:', url);
        }
      }
    } catch (error) {
      console.error('[VideoBannerAd] Error handling banner click:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleBannerClick}
      activeOpacity={0.8}
    >
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>Ad</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📢</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            Sponsored Content
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Tap to learn more
          </Text>
        </View>

        <View style={styles.button}>
          <Text style={styles.buttonText}>Visit</Text>
        </View>
      </View>

      {adData.companionBanner.imageUrl && (
        <Image
          source={{ uri: adData.companionBanner.imageUrl }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    padding: 12,
  },
  adBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  button: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginTop: 12,
  },
});

export default VideoBannerAd;
