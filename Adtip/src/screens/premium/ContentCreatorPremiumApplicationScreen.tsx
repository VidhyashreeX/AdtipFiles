import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Award, User, Phone, MessageSquare, ArrowLeft } from 'lucide-react-native';
import ApiService from '../../services/ApiService';

interface FormData {
  name: string;
  phone: string;
  instagramLink: string;
  youtubeLink: string;
  remarks: string;
}

const ContentCreatorPremiumApplicationScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    phone: user?.mobile_number || '',
    instagramLink: '',
    youtubeLink: '',
    remarks: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.instagramLink.trim()) {
      newErrors.instagramLink = 'Instagram link is required';
    } else if (!isValidUrl(formData.instagramLink)) {
      newErrors.instagramLink = 'Please enter a valid Instagram URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ApiService.post('/api/content-creator/apply-free-premium', {
        userId: user?.id,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        instagramLink: formData.instagramLink.trim(),
        youtubeLink: formData.youtubeLink.trim(),
        remarks: formData.remarks.trim(),
      });

      if (response.status === 200 || response.status === true) {
        Alert.alert(
          'Application Submitted',
          'Your application for free Content Creator Premium has been submitted successfully. We will review your application and get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const styles = createStyles(colors, isDarkMode);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title="Apply for Free Premium"
        showPremium={false}
        showWallet={false}
        showSearch={false}
        showProfile={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.iconContainer}
          >
            <Award size={32} color="#000000" />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Eligibility for AdTip Free Premium 🎉
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            To get 1 Month Free Premium, you must:{'\n\n'}
            ✅ Have at least 10,000 followers on Instagram or YouTube{'\n\n'}
            ✅ Create and post a video about AdTip on your Instagram or YouTube{'\n\n'}
            ✅ Ensure the video gets at least 10,000 views on any one platform{'\n\n'}
            ✅ Clearly mention AdTip and encourage your audience to join{'\n\n'}
            👉 Once all conditions are met, you'll unlock 1 Month Free Premium on AdTip 🚀
          </Text>
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
            Premium Benefits
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                Upload paid videos and earn more
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                Higher ad view earnings
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                Priority support and features
              </Text>
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, { borderColor: errors.name ? '#FF6B6B' : colors.border }]}>
              <User size={20} color={colors.text.secondary} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, { borderColor: errors.phone ? '#FF6B6B' : colors.border }]}>
              <Phone size={20} color={colors.text.secondary} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Instagram Link Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Instagram Link <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, { borderColor: errors.instagramLink ? '#FF6B6B' : colors.border }]}>
              <Icon name="instagram" size={20} color={colors.text.secondary} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={formData.instagramLink}
                onChangeText={(value) => updateFormData('instagramLink', value)}
                placeholder="https://instagram.com/your-profile"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            {errors.instagramLink && <Text style={styles.errorText}>{errors.instagramLink}</Text>}
          </View>

          {/* YouTube Link Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              YouTube Link
            </Text>
            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
              <Icon name="youtube" size={20} color={colors.text.secondary} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={formData.youtubeLink}
                onChangeText={(value) => updateFormData('youtubeLink', value)}
                placeholder="https://youtube.com/your-channel (optional)"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Remarks Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Remarks
            </Text>
            <View style={[styles.textAreaContainer, { borderColor: colors.border }]}>
              <MessageSquare size={20} color={colors.text.secondary} style={styles.textAreaIcon} />
              <TextInput
                style={[styles.textArea, { color: colors.text.primary }]}
                value={formData.remarks}
                onChangeText={(value) => updateFormData('remarks', value)}
                placeholder="Tell us about your content creation experience (optional)"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
    benefitsSection: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    benefitsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    benefitsList: {
      gap: 8,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    benefitText: {
      fontSize: 14,
      flex: 1,
    },
    formSection: {
      gap: 20,
      marginBottom: 32,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
    },
    required: {
      color: '#FF6B6B',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 4,
    },
    textAreaContainer: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      minHeight: 100,
    },
    textAreaIcon: {
      position: 'absolute',
      top: 16,
      left: 16,
    },
    textArea: {
      fontSize: 16,
      paddingLeft: 36,
      paddingTop: 0,
      minHeight: 68,
    },
    errorText: {
      color: '#FF6B6B',
      fontSize: 14,
      marginTop: 4,
    },
    submitButton: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    submitButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default ContentCreatorPremiumApplicationScreen;
