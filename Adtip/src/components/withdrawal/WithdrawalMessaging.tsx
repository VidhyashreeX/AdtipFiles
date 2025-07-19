// src/components/withdrawal/WithdrawalMessaging.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { getWithdrawalMessaging, getUpgradeSuggestionMessage } from '../../utils/withdrawalMessaging';

interface WithdrawalMessagingProps {
  isPremium: boolean;
  variant?: 'info' | 'warning' | 'success' | 'benefits';
  onUpgradePress?: () => void;
  compact?: boolean;
}

const WithdrawalMessaging: React.FC<WithdrawalMessagingProps> = ({
  isPremium,
  variant = 'info',
  onUpgradePress,
  compact = false
}) => {
  const { colors } = useTheme();
  const messaging = getWithdrawalMessaging(isPremium);

  const getVariantConfig = () => {
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: '#FFF3CD',
          borderColor: '#FFEAA7',
          iconColor: '#856404',
          textColor: '#856404',
          icon: 'alert-triangle',
          title: 'Processing Time Notice',
          content: messaging.warningMessage || messaging.processingMessage
        };
      case 'success':
        return {
          backgroundColor: '#D4EDDA',
          borderColor: '#C3E6CB',
          iconColor: '#155724',
          textColor: '#155724',
          icon: 'check-circle',
          title: 'Withdrawal Benefits',
          content: messaging.benefitsMessage || messaging.processingMessage
        };
      case 'benefits':
        return {
          backgroundColor: isPremium ? '#D4EDDA' : '#E2E3E5',
          borderColor: isPremium ? '#C3E6CB' : '#D6D8DB',
          iconColor: isPremium ? '#155724' : '#6C757D',
          textColor: isPremium ? '#155724' : '#6C757D',
          icon: isPremium ? 'star' : 'info',
          title: isPremium ? 'Premium Benefits' : 'Standard Processing',
          content: messaging.benefitsMessage || messaging.requirementsMessage
        };
      default: // info
        return {
          backgroundColor: '#D1ECF1',
          borderColor: '#BEE5EB',
          iconColor: '#0C5460',
          textColor: '#0C5460',
          icon: 'info',
          title: 'Processing Information',
          content: messaging.processingMessage
        };
    }
  };

  const config = getVariantConfig();

  if (compact) {
    return (
      <View style={[
        styles.compactContainer,
        { 
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor
        }
      ]}>
        <View style={styles.compactHeader}>
          <Icon name={config.icon} size={14} color={config.iconColor} />
          <Text style={[styles.compactTitle, { color: config.textColor }]}>
            {messaging.limits.processingDays} business days
          </Text>
        </View>
        <Text style={[styles.compactText, { color: config.textColor }]}>
          {isPremium ? 'Premium processing' : 'Standard processing'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor
      }
    ]}>
      <View style={styles.header}>
        <Icon name={config.icon} size={20} color={config.iconColor} />
        <Text style={[styles.title, { color: config.textColor }]}>
          {config.title}
        </Text>
      </View>
      
      <Text style={[styles.content, { color: config.textColor }]}>
        {config.content}
      </Text>

      {!isPremium && variant === 'warning' && onUpgradePress && (
        <View style={styles.upgradeSection}>
          <Text style={[styles.upgradeText, { color: config.textColor }]}>
            {getUpgradeSuggestionMessage()}
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { borderColor: config.iconColor }]}
            onPress={onUpgradePress}
          >
            <Icon name="arrow-up" size={16} color={config.iconColor} />
            <Text style={[styles.upgradeButtonText, { color: config.iconColor }]}>
              Upgrade to Premium
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isPremium && variant === 'benefits' && (
        <View style={styles.premiumBadge}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={[styles.premiumBadgeText, { color: config.textColor }]}>
            Premium User Benefits Active
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    fontSize: 13,
    lineHeight: 18,
  },
  upgradeSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  upgradeText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Compact styles
  compactContainer: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    marginVertical: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  compactText: {
    fontSize: 11,
  },
});

export default WithdrawalMessaging;
