import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Privacy Policy" 
        showPremium={true}
        showWallet={false}
        showSearch={false}
      />
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Privacy Policy
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            1. Information We Collect
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We collect various types of information to provide and improve our services, including: phone number, device information, location data (with your permission), user behavior and interactions with content, and information you provide in your profile.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            2. How We Use Your Information
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We use your information to deliver personalized content and advertisements, provide rewards, detect and prevent fraud, improve our services, communicate with you about updates or changes, and comply with legal obligations.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            3. Sharing of Information
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We don't sell user data. However, we may share information with analytics providers, advertising partners, payment processors, and service providers who help us operate our platform. We may also share information when required by law or to protect our rights.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            4. Cookies and Tracking
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We use cookies and similar technologies for performance, analytics, and ad targeting. You can manage cookie preferences through your browser settings, though this may impact your ability to use certain features of our service.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            5. Security Measures
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We employ encryption, secure servers, and limited data access policies to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            6. User Rights
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            You can request deletion or correction of your personal data by contacting us. You may also opt out of certain data collection or marketing communications through settings in the app.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            7. Children's Privacy
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We do not knowingly collect data from children under 13. If you believe we have collected information from a child under 13, please contact us to have it removed.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            8. Updates to Policy
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            We'll notify you of any material changes to this Privacy Policy through the app or via email. Your continued use of our services after such notification constitutes acceptance of the updated policy.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            9. Contact Us
          </Text>
          <Text style={[styles.sectionText, { color: colors.text.secondary }]}>
            If you have questions or concerns about our Privacy Policy or data practices, please contact us at privacy@adtip.com
          </Text>
        </View>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
});

export default PrivacyPolicyScreen;