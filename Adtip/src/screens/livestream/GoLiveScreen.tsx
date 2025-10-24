import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { MainNavigatorParamList } from '../../types/navigation';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import { 
  Play, 
  Users, 
  DollarSign, 
  Target, 
  Clock,
  X,
  ChevronDown,
  Crown,
  CheckCircle,
  Zap
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';
import ApiService from '../../services/ApiService';

const { width: screenWidth } = Dimensions.get('window');

// Premium Upgrade Modal Component
interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  onUpgrade
}) => {
  const { colors } = useTheme();
  
  const premiumFeatures = [
    {
      icon: <DollarSign size={24} color="#FFD700" />,
      title: 'Monetize Your Streams',
      description: 'Earn money from every minute viewers watch your livestreams'
    },
    {
      icon: <Target size={24} color="#FFD700" />,
      title: 'Promotional Streams',
      description: 'Create targeted promotional livestreams for businesses'
    },
    {
      icon: <Users size={24} color="#FFD700" />,
      title: 'Unlimited Audience',
      description: 'Stream to unlimited viewers with no restrictions'
    },
    {
      icon: <Zap size={24} color="#FFD700" />,
      title: 'Priority Support',
      description: 'Get priority support and exclusive creator features'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.premiumModalOverlay}>
        <View style={[styles.premiumModalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.premiumModalHeader}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.premiumHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={48} color="white" />
              <Text style={styles.premiumModalTitle}>Content Creator Premium</Text>
              <Text style={styles.premiumModalSubtitle}>
                Unlock professional livestreaming features
              </Text>
            </LinearGradient>
          </View>

          {/* Features List */}
          <ScrollView 
            style={styles.premiumFeaturesContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.premiumSectionTitle, { color: colors.text.primary }]}>
              Why Upgrade to Premium?
            </Text>
            
            {premiumFeatures.map((feature, index) => (
              <View 
                key={index} 
                style={[styles.premiumFeatureItem, { backgroundColor: colors.surface }]}
              >
                <View style={styles.premiumFeatureIcon}>
                  {feature.icon}
                </View>
                <View style={styles.premiumFeatureContent}>
                  <Text style={[styles.premiumFeatureTitle, { color: colors.text.primary }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.premiumFeatureDescription, { color: colors.text.secondary }]}>
                    {feature.description}
                  </Text>
                </View>
                <CheckCircle size={20} color="#00C853" />
              </View>
            ))}

            {/* Pricing Info */}
            <View style={[styles.premiumPricingBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.premiumPricingTitle, { color: colors.text.primary }]}>
                💎 Special Launch Offer
              </Text>
              <Text style={[styles.premiumPricingText, { color: colors.text.secondary }]}>
                Get Content Creator Premium and start earning from your livestreams today!
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.premiumModalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.premiumCancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.premiumCancelButtonText, { color: colors.text.secondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.premiumUpgradeButton}
              onPress={onUpgrade}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.premiumUpgradeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Crown size={20} color="white" />
                <Text style={styles.premiumUpgradeButtonText}>
                  Upgrade Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface CreateStreamModalProps {
  visible: boolean;
  streamType: 'free' | 'influencer' | 'promotional' | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
}

const CreateStreamModal: React.FC<CreateStreamModalProps> = ({
  visible,
  streamType,
  onClose,
  onSubmit,
  loading
}) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    productServiceName: '',
    productServiceDescription: '',
    targetAgeGroup: '18-25',
    targetGender: 'all',
    targetLocation: '',
    targetViewerCount: '100',
    streamDurationMinutes: '30',
    companyPayPerViewerPerMinute: '2'
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a stream title');
      return;
    }

    if (streamType === 'promotional') {
      if (!formData.productServiceName.trim() || 
          !formData.productServiceDescription.trim() ||
          !formData.targetLocation.trim()) {
        Alert.alert('Error', 'Please fill all required fields for promotional stream');
        return;
      }
    }

    onSubmit(formData);
  };

  const calculateCost = () => {
    if (streamType !== 'promotional') return 0;
    
    const viewers = parseInt(formData.targetViewerCount) || 0;
    const duration = parseInt(formData.streamDurationMinutes) || 0;
    const rate = parseFloat(formData.companyPayPerViewerPerMinute) || 0;
    
    return viewers * duration * rate;
  };

  const renderFormField = (label: string, value: string, onChangeText: (text: string) => void, props?: any) => (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: colors.text.primary }]}>{label}</Text>
      <TextInput
        style={[styles.formInput, { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          color: colors.text.primary 
        }]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.text.tertiary}
        {...props}
      />
    </View>
  );

  const renderPickerField = (label: string, selectedValue: string, onValueChange: (value: string) => void, items: Array<{label: string, value: string}>) => (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: colors.text.primary }]}>{label}</Text>
      <View style={[styles.pickerContainer, { 
        backgroundColor: colors.surface, 
        borderColor: colors.border 
      }]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={[styles.picker, { color: colors.text.primary }]}
        >
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
            Create {streamType?.charAt(0).toUpperCase()}{streamType?.slice(1)} Stream
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {renderFormField(
            'Stream Title *',
            formData.title,
            (text) => setFormData({ ...formData, title: text }),
            { placeholder: 'Enter your stream title' }
          )}

          {streamType === 'promotional' && (
            <>
              {renderFormField(
                'Product/Service Name *',
                formData.productServiceName,
                (text) => setFormData({ ...formData, productServiceName: text }),
                { placeholder: 'Enter product or service name' }
              )}

              {renderFormField(
                'Product/Service Description *',
                formData.productServiceDescription,
                (text) => setFormData({ ...formData, productServiceDescription: text }),
                { 
                  placeholder: 'Describe your product or service',
                  multiline: true,
                  numberOfLines: 3
                }
              )}

              {renderPickerField(
                'Target Age Group',
                formData.targetAgeGroup,
                (value) => setFormData({ ...formData, targetAgeGroup: value }),
                [
                  { label: '13-17 years', value: '13-17' },
                  { label: '18-25 years', value: '18-25' },
                  { label: '26-35 years', value: '26-35' },
                  { label: '36-45 years', value: '36-45' },
                  { label: '46-55 years', value: '46-55' },
                  { label: '55+ years', value: '55+' }
                ]
              )}

              {renderPickerField(
                'Target Gender',
                formData.targetGender,
                (value) => setFormData({ ...formData, targetGender: value }),
                [
                  { label: 'All', value: 'all' },
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' }
                ]
              )}

              {renderFormField(
                'Target Location *',
                formData.targetLocation,
                (text) => setFormData({ ...formData, targetLocation: text }),
                { placeholder: 'City, State, Country' }
              )}

              {renderFormField(
                'Target Number of Viewers',
                formData.targetViewerCount,
                (text) => setFormData({ ...formData, targetViewerCount: text }),
                { 
                  placeholder: '100',
                  keyboardType: 'numeric'
                }
              )}

              {renderFormField(
                'Stream Duration (minutes)',
                formData.streamDurationMinutes,
                (text) => setFormData({ ...formData, streamDurationMinutes: text }),
                { 
                  placeholder: '30',
                  keyboardType: 'numeric'
                }
              )}

              {renderFormField(
                'Pay per Viewer per Minute (₹)',
                formData.companyPayPerViewerPerMinute,
                (text) => setFormData({ ...formData, companyPayPerViewerPerMinute: text }),
                { 
                  placeholder: '2.00',
                  keyboardType: 'decimal-pad'
                }
              )}

              <View style={styles.costCalculation}>
                <Text style={[styles.costLabel, { color: colors.text.secondary }]}>
                  Total Cost Calculation:
                </Text>
                <Text style={[styles.costBreakdown, { color: colors.text.tertiary }]}>
                  {formData.targetViewerCount} viewers × {formData.streamDurationMinutes} minutes × ₹{formData.companyPayPerViewerPerMinute}
                </Text>
                <Text style={[styles.totalCost, { color: colors.primary }]}>
                  Total: ₹{calculateCost().toFixed(2)}
                </Text>
              </View>
            </>
          )}

          {streamType === 'influencer' && (
            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Viewers will be charged ₹1 per minute to watch your stream. 
                You'll earn ₹0.90 per minute per viewer (10% platform fee).
              </Text>
            </View>
          )}

          {/* HIDDEN: Free stream info box - commented out to hide from UI */}
          {/* {streamType === 'free' && (
            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Anyone can join and watch your free live stream at no cost.
              </Text>
            </View>
          )} */}
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.createButtonText}>
                {streamType === 'promotional' ? `Pay ₹${calculateCost().toFixed(2)}` : 'Create Stream'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

type GoLiveScreenNavigationProp = NativeStackNavigationProp<MainNavigatorParamList, 'GoLive'>;
type GoLiveScreenRouteProp = RouteProp<MainNavigatorParamList, 'GoLive'>;

const GoLiveScreen: React.FC = () => {
  const navigation = useNavigation<GoLiveScreenNavigationProp>();
  const route = useRoute<GoLiveScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [selectedStreamType, setSelectedStreamType] = useState<'free' | 'influencer' | 'promotional' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Handle initial stream type from navigation params
  React.useEffect(() => {
    if (route.params?.initialStreamType) {
      setSelectedStreamType(route.params.initialStreamType);
      setShowModal(true);
    }
  }, [route.params?.initialStreamType]);

  const streamTypes = [
    // HIDDEN: Free Live Stream option - commented out to hide from UI
    // {
    //   type: 'free' as const,
    //   title: 'Free Live Stream',
    //   description: 'Anyone can join and watch for free',
    //   icon: <Play size={24} color="#4CAF50" />,
    //   gradient: ['#4CAF50', '#45a049'],
    //   features: ['No cost for viewers', 'Open to everyone', 'Unlimited duration']
    // },
    {
      type: 'influencer' as const,
      title: 'Influencer Stream',
      description: 'Viewers pay ₹1 per minute to watch',
      icon: <DollarSign size={24} color="#2196F3" />,
      gradient: ['#2196F3', '#1976D2'],
      features: ['₹1/min from viewers', 'You earn ₹0.90/min per viewer', 'Premium content']
    },
    {
      type: 'promotional' as const,
      title: 'Promotional Stream',
      description: 'Targeted promotion, viewers earn money',
      icon: <Target size={24} color="#FF9800" />,
      gradient: ['#FF9800', '#F57C00'],
      features: ['Target specific audience', 'Viewers earn money', 'Pay for promotion']
    }
  ];

  const handleStreamTypeSelect = useCallback((type: 'free' | 'influencer' | 'promotional') => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to start live streaming.');
      return;
    }

    // Check if user has content creator premium
    // The user object from AuthContext has content_creator_plan_id field
    const hasContentCreatorPremium = user.content_creator_plan_id > 0;
    
    if (!hasContentCreatorPremium) {
      // Show premium upgrade modal
      setShowPremiumModal(true);
      return;
    }

    setSelectedStreamType(type);
    setShowModal(true);
  }, [user]);

  const handleCreateStream = async (formData: any) => {
    setLoading(true);
    
    try {
      let endpoint = '';
      let payload: any = {
        user_id: user?.id,
        title: formData.title
      };

      switch (selectedStreamType) {
        case 'free':
          endpoint = '/api/live-stream/create-free';
          break;
          
        case 'influencer':
          endpoint = '/api/live-stream/create-influencer';
          payload = { ...payload, cost_per_minute: 1 };
          break;
          
        case 'promotional':
          // NEW FLOW: Create payment order first (no stream creation yet)
          endpoint = '/api/live-stream/create-promotional-order';
          payload = {
            ...payload,
            product_service_name: formData.productServiceName,
            product_service_description: formData.productServiceDescription,
            target_age_group: formData.targetAgeGroup,
            target_gender: formData.targetGender,
            target_location: formData.targetLocation,
            target_viewer_count: parseInt(formData.targetViewerCount),
            stream_duration_minutes: parseInt(formData.streamDurationMinutes),
            company_pay_per_viewer_per_minute: parseFloat(formData.companyPayPerViewerPerMinute)
          };
          break;
      }

      const response = await ApiService.post(endpoint, payload);

      console.log('[GoLiveScreen] ===== RESPONSE DEBUG =====');
      console.log('[GoLiveScreen] response.success:', response.success);
      console.log('[GoLiveScreen] response.message:', response.message);
      console.log('[GoLiveScreen] response.data:', response.data);

      if (response.success) {
        setShowModal(false);
        
        if (selectedStreamType === 'promotional') {
          // Handle Razorpay payment FIRST (before stream creation)
          // Keep loading state ON during payment
          handleRazorpayPayment({...response.data, title: formData.title, user_id: user?.id});
        } else {
          // For free and influencer streams, navigate immediately
          setLoading(false);
          const streamData = response.data;
          
          console.log('[GoLiveScreen] streamData:', streamData);
          console.log('[GoLiveScreen] streamData.meeting_id:', streamData?.meeting_id);
          console.log('[GoLiveScreen] streamData.token:', streamData?.token ? `${streamData.token.substring(0, 20)}...` : 'undefined');
          
          if (!streamData?.meeting_id || !streamData?.token) {
            console.error('[GoLiveScreen] ERROR: Missing meeting_id or token in response!');
            Alert.alert('Error', 'Invalid response from server. Please try again.');
            return;
          }
          
          navigation.navigate('LiveStreaming', {
            meetingId: streamData.meeting_id,
            token: streamData.token,
            isHost: true,
            streamTitle: payload.title || 'Live Stream',
            streamType: selectedStreamType || 'free'
          });
        }
      } else {
        setLoading(false);
        Alert.alert('Error', response.message || 'Failed to create stream');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error creating stream:', error);
      Alert.alert('Error', 'Failed to create stream. Please try again.');
    }
  };

  const handleRazorpayPayment = (paymentData: any) => {
    console.log('[GoLiveScreen] Initiating Razorpay payment:', paymentData);
    
    const options = {
      key: paymentData.razorpay_key_id,
      amount: paymentData.total_amount * 100, // Convert to paise
      currency: 'INR',
      name: 'AdTip Live',
      description: `Promotional Stream: ${paymentData.payment_details?.product_service_name || 'Live Stream'}`,
      order_id: paymentData.razorpay_order_id,
      prefill: {
        email: user?.emailId || '',
        contact: user?.mobile_number || '',
        name: user?.name || ''
      },
      theme: { color: colors.primary }
    };

    console.log('[GoLiveScreen] Razorpay options:', options);

    RazorpayCheckout.open(options)
      .then(async (response: any) => {
        // Payment successful, NOW create the stream on backend
        console.log('[GoLiveScreen] Payment successful, creating stream...', response);
        
        try {
          const confirmResponse = await ApiService.post('/api/live-stream/confirm-promotional-payment', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            user_id: paymentData.user_id || user?.id
          });

          console.log('[GoLiveScreen] Stream creation response:', confirmResponse);

          if (confirmResponse.success && confirmResponse.data) {
            const streamData = confirmResponse.data;
            
            console.log('[GoLiveScreen] Stream created successfully:', streamData);
            
            if (!streamData?.meeting_id || !streamData?.token) {
              console.error('[GoLiveScreen] ERROR: Missing meeting_id or token!');
              Alert.alert('Error', 'Stream created but missing details. Please contact support.');
              return;
            }
            
            // Navigate to livestream immediately
            Alert.alert(
              'Success', 
              'Payment confirmed! Your promotional stream is now active.',
              [
                {
                  text: 'Start Streaming',
                  onPress: () => {
                    navigation.navigate('LiveStreaming', {
                      meetingId: streamData.meeting_id,
                      token: streamData.token,
                      isHost: true,
                      streamTitle: paymentData.title || paymentData.payment_details?.title || 'Promotional Stream',
                      streamType: 'promotional'
                    });
                  }
                }
              ]
            );
          } else {
            Alert.alert('Error', confirmResponse.message || 'Failed to create stream after payment.');
          }
        } catch (error: any) {
          console.error('[GoLiveScreen] Error confirming payment:', error);
          Alert.alert(
            'Error', 
            'Payment successful but failed to create stream. Please contact support.'
          );
        }
      })
      .catch((error: any) => {
        console.error('[GoLiveScreen] Payment failed or cancelled:', error);
        Alert.alert('Payment Failed', 'Your payment was not completed.');
      })
      .finally(() => setLoading(false));
  };

  const handleUpgradeToPremium = useCallback(() => {
    setShowPremiumModal(false);
    // Navigate to Content Creator Subscription screen
    navigation.navigate('ContentCreatorSubscriptionScreen' as any);
  }, [navigation]);

  const handleClosePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Go Live" showSearch={false} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Choose Your Stream Type
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Select the type of live stream you want to create
          </Text>
        </View>

        <View style={styles.streamTypesList}>
          {streamTypes.map((streamType, index) => (
            <TouchableOpacity
              key={streamType.type}
              style={[styles.streamTypeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleStreamTypeSelect(streamType.type)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={streamType.gradient}
                style={styles.streamTypeHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.streamTypeIcon}>
                  {streamType.icon}
                </View>
                <View style={styles.streamTypeInfo}>
                  <Text style={styles.streamTypeTitle}>{streamType.title}</Text>
                  <Text style={styles.streamTypeDescription}>{streamType.description}</Text>
                </View>
              </LinearGradient>

              <View style={styles.streamTypeFeatures}>
                {streamType.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.streamTypeFooter}>
                <Text style={[styles.selectButtonText, { color: colors.primary }]}>
                  Select & Configure
                </Text>
                <ChevronDown size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
            How It Works
          </Text>
          <View style={styles.infoItems}>
            <View style={styles.infoItem}>
              <View style={[styles.infoStep, { backgroundColor: colors.primary }]}>
                <Text style={styles.infoStepText}>1</Text>
              </View>
              <Text style={[styles.infoItemText, { color: colors.text.secondary }]}>
                Choose your stream type and configure settings
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoStep, { backgroundColor: colors.primary }]}>
                <Text style={styles.infoStepText}>2</Text>
              </View>
              <Text style={[styles.infoItemText, { color: colors.text.secondary }]}>
                Complete payment for promotional streams
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoStep, { backgroundColor: colors.primary }]}>
                <Text style={styles.infoStepText}>3</Text>
              </View>
              <Text style={[styles.infoItemText, { color: colors.text.secondary }]}>
                Start streaming and engage with your audience
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <PremiumUpgradeModal
        visible={showPremiumModal}
        onClose={handleClosePremiumModal}
        onUpgrade={handleUpgradeToPremium}
      />

      <CreateStreamModal
        visible={showModal}
        streamType={selectedStreamType}
        onClose={() => {
          setShowModal(false);
          setSelectedStreamType(null);
        }}
        onSubmit={handleCreateStream}
        loading={loading}
      />
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
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  streamTypesList: {
    gap: 16,
  },
  streamTypeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  streamTypeHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  streamTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streamTypeInfo: {
    flex: 1,
  },
  streamTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  streamTypeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  streamTypeFeatures: {
    padding: 20,
    paddingTop: 0,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  streamTypeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  infoSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItems: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoStepText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  infoItemText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  costCalculation: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  costBreakdown: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // Premium Modal Styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumModalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  premiumModalHeader: {
    overflow: 'hidden',
  },
  premiumHeaderGradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  premiumModalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  premiumModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 8,
    textAlign: 'center',
  },
  premiumFeaturesContainer: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  premiumSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  premiumFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumFeatureContent: {
    flex: 1,
    marginRight: 12,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  premiumPricingBox: {
    padding: 20,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumPricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumPricingText: {
    fontSize: 15,
    lineHeight: 22,
  },
  premiumModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  premiumCancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumUpgradeButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  premiumUpgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  premiumUpgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default GoLiveScreen;