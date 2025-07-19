import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Download, Gift, Wallet, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import PubScaleService from '../../services/PubScaleService';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';

const InstallToEarnScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [offerwallLoading, setOfferwallLoading] = useState(false);
  const [showPubScaleCreditAlert, setShowPubScaleCreditAlert] = useState(false);

  const styles = createStyles(colors, isDarkMode);

  // Initialize PubScale when screen loads
  useEffect(() => {
    if (user?.id) {
      PubScaleService.initialize(user.id.toString()).catch(error => {
        console.error('Failed to initialize PubScale:', error);
      });
    }
  }, [user?.id]);

  // Handle Install to Earn (PubScale)
  const handleInstallToEarn = useCallback(async () => {
    try {
      setOfferwallLoading(true);
      await PubScaleService.showOfferwall();
      console.log('Offerwall launched successfully');

      // Show enhanced credit alert after user returns from PubScale
      setShowPubScaleCreditAlert(true);
    } catch (error) {
      console.error('Failed to show offerwall:', error);
      Alert.alert('Error', 'Failed to load offerwall. Please try again later.', [{ text: 'OK' }]);
    } finally {
      setOfferwallLoading(false);
    }
  }, []);

  // Handle PubScale credit alert actions
  const handleViewWallet = useCallback(() => {
    navigation.navigate('Wallet' as never);
  }, [navigation]);

  const handleCloseCreditAlert = useCallback(() => {
    setShowPubScaleCreditAlert(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Install to Earn"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      
      <View style={[styles.content, { paddingBottom: contentPaddingBottom }]}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Download size={48} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Install Apps & Earn Money
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Download and try new apps to earn real money rewards. Complete simple tasks and get paid instantly!
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.feature}>
            <Gift size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                Instant Rewards
              </Text>
              <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                Get paid immediately after completing tasks
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Wallet size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                Direct to Wallet
              </Text>
              <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                Earnings are credited directly to your wallet
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={handleInstallToEarn}
            disabled={offerwallLoading}
          >
            {offerwallLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.ctaButtonText}>Start Earning Now</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.text.secondary }]}>
            By continuing, you agree to complete the required tasks to earn rewards
          </Text>
        </View>
      </View>

      {/* PubScale Credit Alert */}
      {showPubScaleCreditAlert && (
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text.primary }]}>
              🎉 Welcome Back!
            </Text>
            <Text style={[styles.alertMessage, { color: colors.text.secondary }]}>
              Check your wallet to see if you've earned any rewards from completed tasks.
            </Text>
            
            <View style={styles.alertButtons}>
              <TouchableOpacity
                style={[styles.alertButton, styles.primaryAlertButton, { backgroundColor: colors.primary }]}
                onPress={handleViewWallet}
              >
                <Wallet size={16} color="#FFFFFF" />
                <Text style={styles.primaryAlertButtonText}>View Wallet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.alertButton, styles.secondaryAlertButton, { borderColor: colors.border }]}
                onPress={handleCloseCreditAlert}
              >
                <Text style={[styles.secondaryAlertButtonText, { color: colors.text.primary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginVertical: 32,
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaSection: {
    marginTop: 'auto',
    paddingBottom: 32,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertButtons: {
    gap: 12,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryAlertButton: {
    // backgroundColor set dynamically
  },
  primaryAlertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryAlertButton: {
    borderWidth: 1.5,
  },
  secondaryAlertButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InstallToEarnScreen;
