import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';

const SupportScreen: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const navigation = useNavigation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@adtip.in');
  };

  const contactMethods = [
    {
      id: 'email',
      icon: 'mail',
      title: 'Email Us',
      subtitle: 'support@adtip.in',
      onPress: handleEmailPress,
      iconBgColor: '#F0F9FF',
      iconColor: '#0091FF',
    },
    /*{
      id: 'chat',
      icon: 'message-circle',
      title: 'Live Chat',
      subtitle: 'Available during business hours',
      onPress: () => console.log('Navigate to live chat'),
      iconBgColor: '#FFFAEB',
      iconColor: '#F6A723',
    },
    {
      id: 'faq',
      icon: 'help-circle',
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions',
      onPress: () => console.log('Navigate to FAQs'),
      iconBgColor: '#FEF6FB',
      iconColor: '#CB1C8D',
    },*/
  ];

  const renderContactMethod = (item: {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    iconBgColor: string;
    iconColor: string;
  }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.contactItem,
        {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'},
      ]}
      onPress={item.onPress}>
      <View style={[styles.contactIconContainer, {backgroundColor: item.iconBgColor}]}>
        <Icon name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={styles.contactTextContainer}>
        <Text style={[styles.contactTitle, {color: colors.text.primary}]}>
          {item.title}
        </Text>
        <Text style={[styles.contactSubtitle, {color: colors.text.secondary}]}>
          {item.subtitle}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Help & Support"
        showSearch={false}
        showWallet={false}
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
        {/* Welcome Card */}
        <View style={[styles.welcomeCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
          <View style={styles.welcomeHeader}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.welcomeIcon}>
              <Icon name="headphones" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.welcomeTitle, {color: colors.text.primary}]}>We're here to help</Text>
          </View>

          <Text style={[styles.welcomeDescription, {color: colors.text.secondary}]}>
            Have questions or need assistance? Our support team is available to help you with any issues.
          </Text>
        </View>

        {/* Contact Methods */}
        {contactMethods.map(renderContactMethod)}

        {/* Business Hours */}
        <View style={[styles.infoCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIconContainer, {backgroundColor: '#ECFDF5'}]}>
              <Icon name="clock" size={20} color="#10B981" />
            </View>
            <Text style={[styles.infoTitle, {color: colors.text.primary}]}>Business Hours</Text>
          </View>
          
          <View style={styles.scheduleItem}>
            <Text style={[styles.scheduleDay, {color: colors.text.secondary}]}>Monday to Friday:</Text>
            <Text style={[styles.scheduleTime, {color: colors.text.primary}]}>9 AM - 6 PM</Text>
          </View>
          
          <View style={styles.scheduleItem}>
            <Text style={[styles.scheduleDay, {color: colors.text.secondary}]}>Saturday:</Text>
            <Text style={[styles.scheduleTime, {color: colors.text.primary}]}>10 AM - 2 PM</Text>
          </View>
          
          <View style={styles.scheduleItem}>
            <Text style={[styles.scheduleDay, {color: colors.text.secondary}]}>Sunday:</Text>
            <Text style={[styles.scheduleTime, {color: colors.text.primary}]}>Closed</Text>
          </View>
        </View>

        {/* Office Address */}
        <View style={[styles.infoCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIconContainer, {backgroundColor: '#FFF5F5'}]}>
              <Icon name="map-pin" size={20} color="#F87171" />
            </View>
            <Text style={[styles.infoTitle, {color: colors.text.primary}]}>Office Address</Text>
          </View>
          
          <Text style={[styles.addressText, {color: colors.text.secondary}]}>
            AdTip Headquarters, Vishakapatnam
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
  scrollContent: {
    padding: 16,
  },
  welcomeCard: {
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
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleDay: {
    fontSize: 14,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 22,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default SupportScreen;
