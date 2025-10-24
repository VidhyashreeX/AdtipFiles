# Quick Implementation Guide - Copy & Paste Code

## 1. Add Channel Earnings API Method

**File:** `c:\A2\adtip-reactnative\Adtip\src\services\ApiService.ts`

Find the `getChannelAnalytics` method and add this right after it (around line 1358):

```typescript
/**
 * Get comprehensive channel earnings and analytics
 */
static async getChannelEarnings(channelId: string | number): Promise<any> {
  try {
    console.log('[ApiService] 💰 Getting channel earnings for:', channelId);
    const response = await this.get(`/api/channel/${channelId}/earnings`);
    console.log('[ApiService] 💰 Channel earnings response:', response);
    return response;
  } catch (error) {
    console.error('[ApiService] ❌ Error getting channel earnings:', error);
    throw this.handleError(error);
  }
}
```

## 2. Update API Endpoints Constants

**File:** `c:\A2\adtip-reactnative\Adtip\src\constants\apiEndpoints.ts`

Update the TIP_TUBE_ENDPOINTS section (around line 27):

```typescript
export const TIP_TUBE_ENDPOINTS = {
  GET_VIDEOS: '/api/getvideos',
  GET_CHANNEL_BY_USER_ID: '/api/getchannelbyuserid',
  GET_ANALYTICS: '/api/analytics',
  GET_CHANNEL_EARNINGS: '/api/channel', // Will be used as /api/channel/:channelId/earnings
};
```

## 3. Update MyChannelScreen for Earnings

**File:** `c:\A2\adtip-reactnative\Adtip\src\screens\channel\MyChannelScreen.tsx`

### A. Add earnings state (around line 79):

```typescript
const [analytics, setAnalytics] = useState<ChannelAnalyticsResponse | null>(null);
const [earnings, setEarnings] = useState<any>(null); // ADD THIS LINE
```

### B. Add fetchChannelEarnings function (around line 225):

```typescript
// Fetch channel earnings
const fetchChannelEarnings = async (channelId: string) => {
  try {
    console.log('💰 [MyChannelScreen] Fetching earnings for channel:', channelId);
    const earningsResponse = await ApiService.getChannelEarnings(channelId);
    
    if (earningsResponse.status && earningsResponse.data) {
      setEarnings(earningsResponse.data);
      console.log('💰 [MyChannelScreen] Earnings data:', earningsResponse.data);
      
      // Update channel with correct earnings data
      setChannel(prev => prev ? {
        ...prev,
        totalViews: earningsResponse.data.earnings?.total_views || 0,
        totalEarnings: earningsResponse.data.earnings?.total_earnings || 0,
      } : null);
    }
  } catch (err) {
    console.error('Error fetching channel earnings:', err);
  }
};
```

### C. Call fetchChannelEarnings in fetchChannelData (around line 161):

Find this line:
```typescript
await fetchChannelAnalytics(channelData.channelId);
```

Add this right after it:
```typescript
await fetchChannelEarnings(channelData.channelId);
```

### D. Add earnings display in UI (around line 520):

Find the "Channel Analytics" section and add this AFTER it:

```typescript
{/* Earnings Breakdown Section */}
{earnings && earnings.earnings && (
  <View style={[styles.section, { backgroundColor: colors.card }]}>
    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
      Earnings Breakdown
    </Text>
    
    <View style={styles.earningsGrid}>
      {/* Total Views */}
      <View style={[styles.earningCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.earningIcon, { backgroundColor: '#2196F3' }]}>
          <Eye size={20} color="white" />
        </View>
        <Text style={[styles.earningLabel, { color: colors.text.secondary }]}>
          Total Views
        </Text>
        <Text style={[styles.earningValue, { color: colors.text.primary }]}>
          {(earnings.earnings.total_views || 0).toLocaleString()}
        </Text>
      </View>

      {/* View Earnings */}
      <View style={[styles.earningCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.earningIcon, { backgroundColor: '#4CAF50' }]}>
          <DollarSign size={20} color="white" />
        </View>
        <Text style={[styles.earningLabel, { color: colors.text.secondary }]}>
          View Earnings
        </Text>
        <Text style={[styles.earningValue, { color: colors.text.primary }]}>
          ₹{(earnings.earnings.view_earnings || 0).toFixed(2)}
        </Text>
      </View>

      {/* Paid Video Earnings */}
      <View style={[styles.earningCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.earningIcon, { backgroundColor: '#FF9800' }]}>
          <Video size={20} color="white" />
        </View>
        <Text style={[styles.earningLabel, { color: colors.text.secondary }]}>
          Paid Content
        </Text>
        <Text style={[styles.earningValue, { color: colors.text.primary }]}>
          ₹{(earnings.earnings.paid_video_earnings || 0).toFixed(2)}
        </Text>
      </View>

      {/* Total Earnings */}
      <View style={[styles.earningCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.earningIcon, { backgroundColor: '#00BCD4' }]}>
          <TrendingUp size={20} color="white" />
        </View>
        <Text style={[styles.earningLabel, { color: colors.text.secondary }]}>
          Total Earnings
        </Text>
        <Text style={[styles.earningValue, { color: colors.text.primary }]}>
          ₹{(earnings.earnings.total_earnings || 0).toFixed(2)}
        </Text>
      </View>
    </View>

    {/* Available Balance */}
    <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
      <Text style={styles.balanceLabel}>Available Balance</Text>
      <Text style={styles.balanceValue}>
        ₹{(earnings.earnings.available_balance || 0).toFixed(2)}
      </Text>
      <TouchableOpacity style={styles.withdrawButton}>
        <Text style={styles.withdrawButtonText}>Withdraw</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

### E. Add styles (at the end of the StyleSheet):

```typescript
earningsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 12,
},
earningCard: {
  flex: 1,
  minWidth: '45%',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
},
earningIcon: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 8,
},
earningLabel: {
  fontSize: 12,
  marginBottom: 4,
},
earningValue: {
  fontSize: 18,
  fontWeight: 'bold',
},
balanceCard: {
  marginTop: 16,
  padding: 20,
  borderRadius: 12,
  alignItems: 'center',
},
balanceLabel: {
  color: 'white',
  fontSize: 14,
  marginBottom: 8,
},
balanceValue: {
  color: 'white',
  fontSize: 32,
  fontWeight: 'bold',
  marginBottom: 16,
},
withdrawButton: {
  backgroundColor: 'white',
  paddingHorizontal: 32,
  paddingVertical: 12,
  borderRadius: 8,
},
withdrawButtonText: {
  color: '#00BCD4',
  fontWeight: 'bold',
  fontSize: 16,
},
```

### F. Add required imports at the top:

```typescript
import {
  // ... existing imports
  Eye,
  DollarSign,
  TrendingUp,
} from 'lucide-react-native';
```

## 4. Fix TipTube Premium Button

**File:** `c:\A2\adtip-reactnative\Adtip\src\screens\tiptube\TipTubeScreen.tsx`

### A. Add imports at the top:

```typescript
import { isPremiumUser } from '../../utils/userDataUtils';
import { Crown } from 'lucide-react-native';
```

### B. Add premium check in component:

Find where the component starts and add:

```typescript
const TipTubeScreen = () => {
  const { user, userData } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  // Check USER premium status (not content creator premium)
  const isPremium = isPremiumUser(userData);
  
  // ... rest of component
```

### C. Update premium button (find and replace):

Find the premium button in the UI and replace with:

```typescript
<TouchableOpacity
  style={[
    styles.premiumButton,
    { 
      backgroundColor: isPremium ? '#00C853' : '#FF0000' 
    }
  ]}
  onPress={() => {
    if (!isPremium) {
      navigation.navigate('PremiumSubscription');
    }
  }}
  activeOpacity={isPremium ? 1 : 0.7}
>
  <Crown size={20} color="white" />
  <Text style={styles.premiumButtonText}>
    {isPremium ? 'Premium Active' : 'Go Premium'}
  </Text>
</TouchableOpacity>
```

### D. Update premium button style:

```typescript
premiumButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  gap: 6,
},
premiumButtonText: {
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
},
```

## 5. Add Premium Badge Component

**File:** Create `c:\A2\adtip-reactnative\Adtip\src\components\common\PremiumBadge.tsx`

```typescript
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
  const { userData } = useAuth();
  const isPremium = isPremiumUser(userData);

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
```

Then use it in any screen:

```typescript
import { PremiumBadge } from '../../components/common/PremiumBadge';

// In JSX:
<View style={styles.header}>
  <Text>User Name</Text>
  <PremiumBadge size="small" />
</View>
```

## 6. Add Livestream Wallet Warnings

**File:** `c:\A2\adtip-reactnative\Adtip\src\screens\livestream\LiveStreamingScreen.tsx`

### A. Add state and refs in HostMode component:

```typescript
const HostMode: React.FC<HostModeProps> = ({ 
  colors, 
  streamTitle, 
  streamType,
  meetingId,
  userId,
  costPerMinute = 1 // Add this prop with default
}) => {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [warningShown, setWarningShown] = useState(false);
  const checkBalanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ... rest of component
```

### B. Add balance checking effect:

```typescript
// Check wallet balance periodically
useEffect(() => {
  const checkBalance = async () => {
    try {
      const response = await ApiService.getWalletBalance(userId);
      if (response.status && response.data) {
        const balance = parseFloat(response.data.totalBalance || 0);
        setWalletBalance(balance);

        // Calculate remaining time
        const remainingMinutes = balance / costPerMinute;
        const remainingSeconds = remainingMinutes * 60;

        console.log('[HostMode] Balance check:', {
          balance,
          costPerMinute,
          remainingMinutes,
          remainingSeconds
        });

        // Show warning if less than 2 minutes remaining
        if (remainingSeconds <= 120 && remainingSeconds > 0 && !warningShown) {
          showBalanceWarning(remainingSeconds);
          setWarningShown(true);
        } else if (balance <= 0) {
          handleEndStreamDueToInsufficientFunds();
        }
      }
    } catch (error) {
      console.error('[HostMode] Error checking balance:', error);
    }
  };

  // Check immediately
  checkBalance();

  // Then check every 30 seconds
  checkBalanceIntervalRef.current = setInterval(checkBalance, 30000);

  return () => {
    if (checkBalanceIntervalRef.current) {
      clearInterval(checkBalanceIntervalRef.current);
    }
  };
}, [userId, costPerMinute, warningShown]);
```

### C. Add warning functions:

```typescript
const showBalanceWarning = (remainingSeconds: number) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  Alert.alert(
    '⚠️ Low Balance Warning',
    `Your livestream will end in ${minutes}:${seconds.toString().padStart(2, '0')} due to insufficient funds.`,
    [
      {
        text: 'Add Funds',
        onPress: () => {
          navigation.navigate('AddFundsScreen');
        }
      },
      {
        text: 'Continue',
        style: 'cancel'
      }
    ],
    { cancelable: false }
  );
};

const handleEndStreamDueToInsufficientFunds = async () => {
  // Clear the balance check interval
  if (checkBalanceIntervalRef.current) {
    clearInterval(checkBalanceIntervalRef.current);
  }

  Alert.alert(
    'Stream Ended',
    'Your livestream has ended due to insufficient wallet balance.',
    [
      {
        text: 'Add Funds',
        onPress: () => {
          navigation.navigate('AddFundsScreen');
        }
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await ApiService.endLiveStream({
              user_id: userId,
              meeting_id: meetingId,
            });
          } catch (error) {
            console.error('[HostMode] Error ending stream:', error);
          } finally {
            leave();
            navigation.goBack();
          }
        }
      }
    ],
    { cancelable: false }
  );
};
```

### D. Add balance indicator to UI:

```typescript
return (
  <View style={styles.hostContainer}>
    {/* Balance Indicator */}
    <View style={[
      styles.balanceIndicator, 
      { 
        backgroundColor: walletBalance / costPerMinute <= 2 
          ? 'rgba(255, 152, 0, 0.9)' 
          : 'rgba(0, 0, 0, 0.6)' 
      }
    ]}>
      <DollarSign size={16} color="white" />
      <Text style={styles.balanceText}>
        ₹{walletBalance.toFixed(2)}
      </Text>
      <Text style={styles.timeText}>
        (~{Math.floor(walletBalance / costPerMinute)} min)
      </Text>
    </View>

    {/* Low Balance Warning Banner */}
    {walletBalance / costPerMinute <= 2 && walletBalance > 0 && (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          ⚠️ Low Balance! Add funds to continue streaming
        </Text>
        <TouchableOpacity
          style={styles.addFundsButton}
          onPress={() => navigation.navigate('AddFundsScreen')}
        >
          <Text style={styles.addFundsButtonText}>Add Funds</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* Rest of Host UI */}
    {/* ... */}
  </View>
);
```

### E. Add styles:

```typescript
balanceIndicator: {
  position: 'absolute',
  top: 60,
  left: 16,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  gap: 6,
  zIndex: 10,
},
balanceText: {
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
},
timeText: {
  color: 'white',
  fontSize: 12,
},
warningBanner: {
  position: 'absolute',
  top: 100,
  left: 16,
  right: 16,
  backgroundColor: '#FF9800',
  padding: 12,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: 10,
},
warningText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
  flex: 1,
},
addFundsButton: {
  backgroundColor: 'white',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
},
addFundsButtonText: {
  color: '#FF9800',
  fontSize: 12,
  fontWeight: 'bold',
},
```

### F. Add DollarSign import:

```typescript
import {
  // ... existing imports
  DollarSign,
} from 'lucide-react-native';
```

## 7. Fix Livestream Participant Count

**File:** `c:\A2\adtip-reactnative\Adtip\src\screens\livestream\LiveStreamingScreen.tsx`

### A. Update HostMode to use VideoSDK participant events:

```typescript
const HostMode: React.FC<HostModeProps> = ({ ... }) => {
  const [showViewerList, setShowViewerList] = useState(false);
  
  // Get meeting with participant events
  const { participants, leave } = useMeeting({
    onParticipantJoined: (participant) => {
      console.log('[HostMode] 👤 Viewer joined:', {
        id: participant.id,
        displayName: participant.displayName
      });
    },
    onParticipantLeft: (participant) => {
      console.log('[HostMode] 👋 Viewer left:', {
        id: participant.id,
        displayName: participant.displayName
      });
    },
  });

  // Get viewers (exclude local/host participant)
  const viewers = useMemo(() => {
    return Array.from(participants.values()).filter(p => !p.local);
  }, [participants]);

  const viewerCount = viewers.length;

  // Log participant updates
  useEffect(() => {
    console.log('[HostMode] Participants updated:', {
      total: participants.size,
      viewers: viewerCount,
      participants: Array.from(participants.values()).map(p => ({
        id: p.id,
        displayName: p.displayName,
        isLocal: p.local
      }))
    });
  }, [participants]);

  return (
    <View>
      {/* Viewer Count Display */}
      <View style={styles.viewerCountBadge}>
        <Users size={18} color="white" />
        <Text style={styles.viewerCountText}>
          {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
        </Text>
        <TouchableOpacity
          style={styles.viewerListButton}
          onPress={() => setShowViewerList(true)}
        >
          <ChevronDown size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Viewer List Modal */}
      <Modal
        visible={showViewerList}
        animationType="slide"
        transparent
        onRequestClose={() => setShowViewerList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.viewerListModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Viewers ({viewerCount})
              </Text>
              <TouchableOpacity onPress={() => setShowViewerList(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={viewers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.viewerItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.viewerAvatar}>
                    <User size={20} color={colors.text.primary} />
                  </View>
                  <Text style={[styles.viewerName, { color: colors.text.primary }]}>
                    {item.displayName || 'Anonymous Viewer'}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No viewers yet
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Rest of Host UI */}
    </View>
  );
};
```

### B. Add styles for viewer list:

```typescript
viewerCountBadge: {
  position: 'absolute',
  top: 16,
  right: 16,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  gap: 6,
  zIndex: 10,
},
viewerCountText: {
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
},
viewerListButton: {
  marginLeft: 4,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
viewerListModal: {
  maxHeight: '70%',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: 20,
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
},
viewerItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
},
viewerAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#E0E0E0',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},
viewerName: {
  fontSize: 16,
},
emptyText: {
  textAlign: 'center',
  padding: 20,
},
```

### C. Add required imports:

```typescript
import {
  // ... existing imports
  ChevronDown,
  User,
} from 'lucide-react-native';
```

---

## Testing Checklist

After implementing all changes, test:

- [ ] Content creator subscription works end-to-end
- [ ] Channel earnings display with correct values
- [ ] View counts update properly
- [ ] Paid video earnings calculated correctly
- [ ] Livestream viewer count updates in real-time
- [ ] Viewer list shows all participants
- [ ] Premium button is green for premium users
- [ ] Premium button is red for non-premium users
- [ ] Premium badge shows on profile/home for premium users
- [ ] Livestream balance indicator displays correctly
- [ ] Warning appears at 2 minutes remaining
- [ ] Add funds navigation works
- [ ] Stream auto-ends when balance reaches zero

---

**Quick Reference:**
1. Bug #1 (Subscription): ✅ Already fixed in ContentCreatorSubscriptionScreen.tsx
2. Bug #2 (Analytics): Add getChannelEarnings API + UI display in MyChannelScreen
3. Bug #3 (Livestream Count): Use VideoSDK participant callbacks + viewer list modal
4. Bug #4 (Premium UI): Fix TipTube button + add PremiumBadge component
5. Bug #5 (Wallet Warnings): Add balance checking + warnings + auto-end in HostMode

All code above is ready to copy and paste directly into your files!
