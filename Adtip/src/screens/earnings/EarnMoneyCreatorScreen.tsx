import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Star, Trophy } from 'lucide-react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {useContentCreatorPremium} from '../../contexts/ContentCreatorPremiumContext';
import Header from '../../components/common/Header';
import YouTubePlayer from '../../components/common/YouTubePlayer';
import {useNavigation} from '@react-navigation/native';

const EarnMoneyCreatorScreen: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const {isContentCreatorPremium} = useContentCreatorPremium();
  const navigation = useNavigation();

  // Revenue streams data
  const revenueStreams = [
    {
      id: 'free_videos',
      title: 'Free Videos',
      icon: 'video',
      iconBgColor: '#F0F9FF',
      iconColor: '#0091FF',
      earning: '₹1000 per 100,000 views',
      description: 'Monetize your free content through ad revenue'
    },
    {
      id: 'premium_videos',
      title: 'Premium Videos',
      icon: 'star',
      iconBgColor: '#FFFAEB',
      iconColor: '#F6A723',
      earning: '₹0.20-₹5 per view',
      description: 'Set your own pricing for premium content'
    },
    {
      id: 'fan_calls',
      title: 'Fan Calls',
      icon: 'phone',
      iconBgColor: '#FEF6FB',
      iconColor: '#CB1C8D',
      earning: 'Direct paid interactions',
      description: 'Connect with your audience through paid calls'
    }
  ];

  const premiumRequirements = [
    'Premium Creator access required for full earning features',
    'Get 1 month free by referring 1000 users',
    'Higher revenue potential and growth opportunities'
  ];

  const successTips = [
    'Create engaging, high-quality content',
    'Build and grow fan base for maximum earnings',
    'Consistency is key to building a loyal audience',
    'Engage with your community regularly'
  ];

  const renderRevenueCard = (stream: any) => (
    <View key={stream.id} style={[styles.revenueCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, {backgroundColor: stream.iconBgColor}]}>
          <Icon name={stream.icon} size={24} color={stream.iconColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, {color: colors.text.primary}]}>{stream.title}</Text>
          <Text style={[styles.earningAmount, {color: '#10B981'}]}>{stream.earning}</Text>
        </View>
      </View>
      <Text style={[styles.cardDescription, {color: colors.text.secondary}]}>{stream.description}</Text>
    </View>
  );

  const renderPremiumCard = () => (
    <View style={[styles.premiumCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
      <LinearGradient
        colors={['#8B5CF6', '#A855F7']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.premiumHeader}>
        <Trophy size={24} color="#FFFFFF" />
        <Text style={styles.premiumTitle}>Premium Benefits</Text>
      </LinearGradient>
      
      <View style={styles.requirementsContainer}>
        {premiumRequirements.map((requirement, index) => (
          <View key={index} style={styles.requirementItem}>
            <Icon name="check-circle" size={16} color="#8B5CF6" />
            <Text style={[styles.requirementText, {color: colors.text.secondary}]}>{requirement}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSuccessTipsCard = () => (
    <View style={[styles.tipsCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, {backgroundColor: '#FFF5F5'}]}>
          <Star size={24} color="#F87171" />
        </View>
        <Text style={[styles.cardTitle, {color: colors.text.primary}]}>Success Tips</Text>
      </View>
      
      <View style={styles.tipsContainer}>
        {successTips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={[styles.tipNumber, {backgroundColor: '#F87171'}]}>
              <Text style={styles.tipNumberText}>{index + 1}</Text>
            </View>
            <Text style={[styles.tipText, {color: colors.text.secondary}]}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderGetStartedCard = () => {
    if (isContentCreatorPremium) return null; // Don't show for premium users

    return (
      <View style={[styles.getStartedCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.getStartedGradient}>
          <View style={styles.getStartedContent}>
            <Icon name="star" size={32} color="#FFFFFF" />
            <View style={styles.getStartedText}>
              <Text style={styles.getStartedTitle}>Ready to Start Earning More?</Text>
              <Text style={styles.getStartedSubtitle}>Join thousands of creators making money</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('ContentCreatorPremium' as never)}
          >
            <Text style={styles.getStartedButtonText}>Get Creator Premium</Text>
            <Icon name="arrow-right" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Earn Money as a Content Creator"
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
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Get Started */}
        {renderGetStartedCard()}

        {/* Revenue Streams Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>Revenue Streams</Text>
          {revenueStreams.map(renderRevenueCard)}
        </View>

        {/* Premium Requirements */}
        {renderPremiumCard()}

        {/* Success Tips */}
        {renderSuccessTipsCard()}

        {/* Tutorial Video */}
        <YouTubePlayer
          videoId="oV0Wt8tui2Q"
          title="How to Earn Money as a Content Creator - Tutorial"
          height={220}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  revenueCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  getStartedCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  earningAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requirementsContainer: {
    padding: 16,
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  tipsContainer: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  getStartedGradient: {
    padding: 20,
  },
  getStartedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  getStartedText: {
    flex: 1,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  getStartedSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default EarnMoneyCreatorScreen;
