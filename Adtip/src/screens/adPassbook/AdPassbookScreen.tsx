import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/common/Header';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import LinearGradient from 'react-native-linear-gradient';
import ScreenTransition from '../../components/common/ScreenTransition';
import ApiService from '../../services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  createdDate: string;
  reach: string;
  clicks: string;
  ctr: string;
  budget: number;
  spent: number;
  duration: number;
  daysLeft: number;
};

interface AdPassbookResponse {
  status: number;
  message: string;
  data: any[];
}

const AdPassbookScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  
  // Add a try/catch block to handle missing context
  let contentPaddingBottom = 0;
  try {
    // Try to use the TabNavigator context
    const tabNavigator = useTabNavigator();
    contentPaddingBottom = tabNavigator.contentPaddingBottom;
  } catch (error) {
    // Fallback to a reasonable value if context is not available
    contentPaddingBottom = 80; // Default padding that should work in most cases
  }

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    reach: '2.5M',
    spent: '$7K',
  };

  // Fetch ad passbook data from API
  const fetchAdPassbook = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      // Get user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      console.log('[AdPassbook] Fetching ad passbook for user ID:', userId);

      // Call the API using the correct endpoint
      const response: AdPassbookResponse = await ApiService.get(`/api/getadpassbook/${userId}`);
      
      console.log('[AdPassbook] API Response:', response);

      if (response.status === 200) {
        // Transform API data to match our Campaign type if needed
        // For now, we'll use mock data since the API returns empty data
        if (response.data && response.data.length > 0) {
          // Transform real data here when available
          const transformedCampaigns = response.data.map((item: any, index: number) => ({
            id: item.id?.toString() || index.toString(),
            name: item.name || `Campaign ${index + 1}`,
            status: item.status || 'active',
            createdDate: item.createdDate || new Date().toLocaleDateString('en-GB'),
            reach: item.reach || '0',
            clicks: item.clicks || '0',
            ctr: item.ctr || '0%',
            budget: item.budget || 0,
            spent: item.spent || 0,
            duration: item.duration || 0,
            daysLeft: item.daysLeft || 0,
          }));
          setCampaigns(transformedCampaigns);
        } else {
          // No campaigns found - set empty state
          setCampaigns([]);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch ad passbook data');
      }
    } catch (error: any) {
      console.error('[AdPassbook] Error fetching data:', error);
      setError(error.message || 'Failed to load ad passbook data');
      // Set empty campaigns on error
      setCampaigns([]);
    } finally {
      setLoading(false);
      if (refreshing) {
        setRefreshing(false);
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAdPassbook();
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdPassbook(false);
  };

  const navigateToCreateCampaign = () => {
    navigation.navigate('CreateCampaign' as never);
  };

  const handleViewCampaign = (campaign: Campaign) => {
    // Navigate to campaign details
    console.log('[AdPassbook] View campaign:', campaign.id);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    // Navigate to campaign edit screen
    console.log('[AdPassbook] Edit campaign:', campaign.id);
  };

  const handleTogglePause = (campaign: Campaign) => {
    // Toggle campaign status
    const updatedCampaigns = campaigns.map(c => {
      if (c.id === campaign.id) {
        return {
          ...c,
          status: c.status === 'active' ? 'paused' : 'active',
        } as Campaign;
      }
      return c;
    });
    setCampaigns(updatedCampaigns);
  };

  const renderStatCard = (title: string, value: string, color: string, iconName: string) => (
    <View 
      style={[
        styles.statCard, 
        { 
          borderLeftColor: color,
          backgroundColor: isDarkMode ? colors.card : '#fff'
        }
      ]}
    >
      <Icon name={iconName} size={20} color={color} style={styles.statIcon} />
      <Text style={[styles.statValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.text.secondary }]}>{title}</Text>
    </View>
  );

  const renderCampaignCard = (campaign: Campaign) => {
    const progressPercent = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
    const statusColor = campaign.status === 'active' ? '#10B981' : 
                        campaign.status === 'paused' ? '#F59E0B' : '#6B7280';
    
    return (
      <View 
        style={[
          styles.campaignCard, 
          { 
            backgroundColor: isDarkMode ? colors.card : '#fff',
            shadowOpacity: isDarkMode ? 0.3 : 0.1 
          }
        ]}
      >
        <View style={styles.campaignHeader}>
          <Text style={[styles.campaignName, { color: colors.text.primary }]}>{campaign.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? `${statusColor}30` : `${statusColor}15` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.dateText, { color: colors.text.tertiary }]}>
          Created {campaign.createdDate}
        </Text>
        
        <View style={styles.statsRow}>
          {renderStatCard('Reach', campaign.reach, '#5467FF', 'users')}
          {renderStatCard('Clicks', campaign.clicks, '#10B981', 'mouse-pointer')}
          {renderStatCard('CTR', campaign.ctr, '#8B5CF6', 'target')}
          {renderStatCard('Spent', `$${campaign.spent}`, '#F59E0B', 'dollar-sign')}
        </View>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleViewCampaign(campaign)}>
            <Icon name="eye" size={16} color={colors.text.secondary} />
            <Text style={[styles.actionText, { color: colors.text.secondary }]}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEditCampaign(campaign)}>
            <Icon name="edit-2" size={16} color={colors.text.secondary} />
            <Text style={[styles.actionText, { color: colors.text.secondary }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => handleTogglePause(campaign)}>
            <Icon 
              name={campaign.status === 'active' ? "pause" : "play"} 
              size={16} 
              color={colors.text.secondary} 
            />
            <Text style={[styles.actionText, { color: colors.text.secondary }]}>
              {campaign.status === 'active' ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.sectionDivider, { backgroundColor: isDarkMode ? colors.border : '#E5E7EB' }]} />
        
        <View style={styles.budgetSection}>
          <View style={styles.sectionHeader}>
            <Icon name="dollar-sign" size={16} color={colors.text.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Budget & Spend</Text>
          </View>
          
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Budget:</Text>
            <Text style={[styles.budgetValue, { color: colors.text.primary }]}>${campaign.budget}</Text>
          </View>
          
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Spent:</Text>
            <Text style={[styles.budgetValue, { color: colors.text.primary }]}>${campaign.spent}</Text>
          </View>
          
          <View style={[styles.progressBarContainer, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progressPercent}%`, 
                  backgroundColor: progressPercent > 90 ? '#EF4444' : colors.primary 
                }
              ]} 
            />
          </View>
          
          <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
            {progressPercent}% used
          </Text>
        </View>
        
        <View style={[styles.sectionDivider, { backgroundColor: isDarkMode ? colors.border : '#E5E7EB' }]} />
        
        <View style={styles.performanceSection}>
          <View style={styles.sectionHeader}>
            <Icon name="trending-up" size={16} color={colors.text.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Performance</Text>
          </View>
          
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>Reach</Text>
              <Text style={[styles.performanceValue, { color: colors.text.primary }]}>{campaign.reach}</Text>
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>Clicks</Text>
              <Text style={[styles.performanceValue, { color: colors.text.primary }]}>{campaign.clicks}</Text>
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>CTR</Text>
              <Text style={[styles.performanceValue, { color: '#10B981' }]}>{campaign.ctr}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.sectionDivider, { backgroundColor: isDarkMode ? colors.border : '#E5E7EB' }]} />
        
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeader}>
            <Icon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Timeline</Text>
          </View>
          
          <View style={styles.timelineRow}>
            <View style={styles.timelineItem}>
              <Text style={[styles.timelineLabel, { color: colors.text.secondary }]}>Duration:</Text>
              <Text style={[styles.timelineValue, { color: colors.text.primary }]}>{campaign.duration} days</Text>
            </View>
            
            <View style={styles.timelineItem}>
              <Text style={[styles.timelineLabel, { color: colors.text.secondary }]}>Days left:</Text>
              <Text style={[styles.timelineValue, { color: colors.text.primary }]}>{campaign.daysLeft} days</Text>
            </View>
          </View>
          
          {campaign.daysLeft > 0 && (
            <View style={[styles.daysLeftProgressContainer, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
              <View 
                style={[
                  styles.daysLeftProgress, 
                  { 
                    width: `${campaign.duration > 0 ? (campaign.daysLeft / campaign.duration) * 100 : 0}%`, 
                    backgroundColor: '#10B981' 
                  }
                ]} 
              />
            </View>
          )}
          
          {campaign.status === 'completed' && (
            <View style={styles.completedContainer}>
              <Text style={[styles.completedText, { color: '#10B981' }]}>
                100% completed
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="bar-chart-2" size={48} color={colors.text.tertiary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        No Ad Campaigns Yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
        Create your first campaign to start advertising
      </Text>
      <TouchableOpacity 
        style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
        onPress={navigateToCreateCampaign}
      >
        <Text style={[styles.emptyStateButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>
          Create Campaign
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Error state component
  const renderErrorState = () => (
    <View style={styles.errorStateContainer}>
      <Icon name="alert-circle" size={48} color="#EF4444" />
      <Text style={[styles.errorStateTitle, { color: colors.text.primary }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorStateSubtitle, { color: colors.text.secondary }]}>
        {error}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={() => fetchAdPassbook()}
      >
        <Text style={[styles.retryButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ScreenTransition animationType="scale">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <Header title="My Ad Passbook" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading your campaigns...
            </Text>
          </View>
        </SafeAreaView>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition animationType="scale">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="My Ad Passbook"
          showWallet={false}
          showSearch={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: contentPaddingBottom}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              My Ad Campaigns
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Manage and monitor your campaigns
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={navigateToCreateCampaign}
          >
            <Icon name="plus" size={18} color={isDarkMode ? '#000' : '#fff'} />
            <Text style={[styles.createButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>
              Create New Campaign
            </Text>
          </TouchableOpacity>

          {error ? (
            renderErrorState()
          ) : campaigns.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <View style={styles.statsContainer}>
                {renderStatCard('Total', stats.total.toString(), '#5467FF', 'bar-chart-2')}
                {renderStatCard('Active', stats.active.toString(), '#10B981', 'activity')}
                {renderStatCard('Reach', stats.reach, '#8B5CF6', 'users')}
                {renderStatCard('Spent', stats.spent, '#F59E0B', 'dollar-sign')}
              </View>
              
              <FlatList
                data={campaigns}
                renderItem={({item}) => renderCampaignCard(item)}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderLeftWidth: 3,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
  },
  campaignCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 16,
  },
  budgetSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetLabel: {
    fontSize: 14,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  timelineSection: {},
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timelineItem: {},
  timelineLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysLeftProgressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  daysLeftProgress: {
    height: '100%',
  },
  completedContainer: {
    marginTop: 12,
  },
  completedText: {
    fontSize: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default AdPassbookScreen;
