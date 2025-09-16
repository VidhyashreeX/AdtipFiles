// src/components/home/SurveyOfferwallSection.tsx - Horizontal survey cards section

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { ChevronRight, Gift } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import SurveyCard from './SurveyCard';
import { getActiveSurveyProviders, getComingSoonSurveyProviders } from '../../data/surveys';
import SurveyService from '../../services/SurveyService';
import { Logger } from '../../utils/ProductionLogger';

interface SurveyOfferwallSectionProps {
  onViewAll?: () => void;
}

const SurveyOfferwallSection: React.FC<SurveyOfferwallSectionProps> = ({ onViewAll }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const activeSurveys = getActiveSurveyProviders();
  const comingSoonSurveys = getComingSoonSurveyProviders();
  
  // Combine active and coming soon (limit to 5 total for the horizontal scroll)
  const allSurveys = [...activeSurveys, ...comingSoonSurveys].slice(0, 5);

  const styles = createSurveyOfferwallStyles(colors, isDarkMode);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Navigate to dedicated survey screen in the future
      Alert.alert(
        'Survey Hub',
        'Full survey marketplace coming soon! More earning opportunities await.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleSurveyCardPress = async (surveyId: string, surveyName: string) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to access surveys and start earning!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Logger.info('SurveyOfferwallSection', `User ${user.id} accessed survey: ${surveyName}`);
    
    // Track survey engagement
    try {
      await SurveyService.trackSurveyEngagement({
        survey_id: surveyId,
        provider_name: surveyName,
        action_type: 'click'
      });
    } catch (error) {
      Logger.error('SurveyOfferwallSection', 'Failed to track survey engagement:', error);
    }
    
    // Default behavior will be handled by SurveyCard component
  };

  if (!allSurveys.length) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <Gift size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Earn with Surveys</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewAllButton} 
          onPress={handleViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Survey Cards Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        decelerationRate="fast"
        snapToInterval={120} // Approximate card width + margin
        snapToAlignment="start"
      >
        {allSurveys.map((survey, index) => (
          <SurveyCard
            key={`${survey.id}-${index}`}
            {...survey}
            onPress={() => handleSurveyCardPress(survey.id, survey.name)}
          />
        ))}
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>
          💡 Complete surveys to earn rewards instantly!
        </Text>
      </View>
    </View>
  );
};

const createSurveyOfferwallStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  sectionContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
  scrollView: {
    marginHorizontal: -16, // Compensate for section padding
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: 20, // Extra padding at the end
  },
  footerInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SurveyOfferwallSection;