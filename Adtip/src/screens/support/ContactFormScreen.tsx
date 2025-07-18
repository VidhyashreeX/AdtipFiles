import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import ApiService from '../../services/ApiService';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
}

const ContactFormScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ContactFormData>({
    name: user?.name || '',
    email: user?.emailId || '',
    phone: user?.phone || '',
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ApiService.submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        category: formData.category,
        priority: formData.priority,
        app_version: '1.0.0', // You can get this from app config
        device_info: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      });

      if (response.status === 200) {
        Alert.alert(
          'Success!',
          `Your message has been submitted successfully. Reference: ${response.data.reference_number}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to submit contact form');
      }
    } catch (error: any) {
      console.error('[ContactForm] Error submitting form:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit your message. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, navigation]);

  const updateFormData = useCallback((field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: 8,
    },
    requiredLabel: {
      color: colors.error,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.background.secondary,
      minHeight: 48,
    },
    inputError: {
      borderColor: colors.error,
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pickerOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border.primary,
      backgroundColor: colors.background.secondary,
    },
    pickerOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pickerOptionText: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    pickerOptionTextSelected: {
      color: colors.white,
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 32,
    },
    submitButtonDisabled: {
      backgroundColor: colors.text.disabled,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Contact Us" showBackButton />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Name <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text.disabled}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Email <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email address"
                placeholderTextColor={colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.text.disabled}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Message Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.pickerOption,
                      formData.category === category.value && styles.pickerOptionSelected,
                    ]}
                    onPress={() => updateFormData('category', category.value)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.category === category.value && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.pickerOption,
                      formData.priority === priority.value && styles.pickerOptionSelected,
                    ]}
                    onPress={() => updateFormData('priority', priority.value)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.priority === priority.value && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Subject <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.subject && styles.inputError]}
                value={formData.subject}
                onChangeText={(value) => updateFormData('subject', value)}
                placeholder="Brief description of your inquiry"
                placeholderTextColor={colors.text.disabled}
                maxLength={200}
              />
              {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Message <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.message && styles.inputError]}
                value={formData.message}
                onChangeText={(value) => updateFormData('message', value)}
                placeholder="Please provide detailed information about your inquiry..."
                placeholderTextColor={colors.text.disabled}
                multiline
                maxLength={2000}
              />
              {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
              <Text style={[styles.errorText, { color: colors.text.disabled }]}>
                {formData.message.length}/2000 characters
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.loadingText}>Submitting...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit Message</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ContactFormScreen;
