import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/common/Header';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import LinearGradient from 'react-native-linear-gradient';

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

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Sale Campaign',
      status: 'active',
      createdDate: '29/03/2024',
      reach: '259K',
      clicks: '3.3K',
      ctr: '2.6%',
      budget: 2500,
      spent: 1850,
      duration: 14,
      daysLeft: 8,
    },
    {
      id: '2',
      name: 'Product Launch',
      status: 'completed',
      createdDate: '15/02/2024',
      reach: '45K',
      clicks: '1.2K',
      ctr: '2.7%',
      budget: 1500,
      spent: 1500,
      duration: 30,
      daysLeft: 0,
    },
  ]);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    reach: '2.5M',
    spent: '$7K',
  };

  const navigateToCreateCampaign = () => {
    navigation.navigate('CreateCampaign' as never);
  };

  const handleViewCampaign = (campaign: Campaign) => {
    // Navigate to campaign details
  };

  const handleEditCampaign = (campaign: Campaign) => {
    // Navigate to campaign edit screen
  };

  const handleTogglePause = (campaign: Campaign) => {
    // Toggle campaign status
    const updatedCampaigns = campaigns.map(c => {
      if (c.id === campaign.id) {
        return {
          ...c,
          status: c.status === 'active' ? 'paused' : 'active',
        };
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
    const progressPercent = Math.round((campaign.spent / campaign.budget) * 100);
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
          {renderStatCard('Total', campaign.reach, '#5467FF', 'users')}
          {renderStatCard('Active', '1', '#10B981', 'activity')}
          {renderStatCard('Reach', campaign.reach, '#8B5CF6', 'eye')}
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
                    width: `${(campaign.daysLeft / campaign.duration) * 100}%`, 
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="My Ad Passbook" showBackButton />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: contentPaddingBottom}}
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
      </ScrollView>
    </SafeAreaView>
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
});

export default AdPassbookScreen;
