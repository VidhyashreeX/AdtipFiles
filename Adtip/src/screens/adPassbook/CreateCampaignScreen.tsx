import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Slider,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/common/Header';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';

const professions = [
  'Software Engineer',
  'Doctor',
  'Teacher',
  'Marketing Professional',
  'Sales Representative',
  'Consultant',
  'Student',
  'Freelancer',
  'Designer',
];

// Define marital status options
const maritalStatusOptions = [
  { id: 'single', label: 'Single' },
  { id: 'married', label: 'Married' },
  { id: 'both', label: 'Both' },
];

const CreateCampaignScreen: React.FC = () => {
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

  // Campaign state
  const [gender, setGender] = useState<'male' | 'female' | 'all'>('all');
  const [maritalStatus, setMaritalStatus] = useState('Select marital status');
  const [ageRange, setAgeRange] = useState([18, 65]);
  const [location, setLocation] = useState('');
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [budget, setBudget] = useState(1000);
  const [duration, setDuration] = useState('1 Week');

  // State for dropdown visibility
  const [maritalStatusDropdownVisible, setMaritalStatusDropdownVisible] = useState(false);

  const toggleProfession = (profession: string) => {
    if (selectedProfessions.includes(profession)) {
      setSelectedProfessions(selectedProfessions.filter(p => p !== profession));
    } else {
      setSelectedProfessions([...selectedProfessions, profession]);
    }
  };

  const handleMaritalStatusSelect = (option: typeof maritalStatusOptions[0]) => {
    setMaritalStatus(option.label);
    setMaritalStatusDropdownVisible(false);
  };

  const handleLaunchCampaign = () => {
    // Logic to launch the campaign
    navigation.goBack();
  };

  const handleSaveAsDraft = () => {
    // Logic to save as draft
    navigation.goBack();
  };

  const handlePreviewAd = () => {
    // Logic to preview ad
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Create Campaign"/>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom + 20 }}
      >
        {/* Audience Targeting Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="users" size={20} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Audience Targeting</Text>
          </View>
          
          {/* Gender Selection */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Target Gender</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={styles.radioOption} 
              onPress={() => setGender('male')}
            >
              <View style={[
                styles.radioCircle, 
                gender === 'male' && [styles.radioCircleSelected, { borderColor: colors.primary }]
              ]}>
                {gender === 'male' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.radioText, { color: colors.text.primary }]}>Male</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.radioOption} 
              onPress={() => setGender('female')}
            >
              <View style={[
                styles.radioCircle, 
                gender === 'female' && [styles.radioCircleSelected, { borderColor: colors.primary }]
              ]}>
                {gender === 'female' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.radioText, { color: colors.text.primary }]}>Female</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.radioOption} 
              onPress={() => setGender('all')}
            >
              <View style={[
                styles.radioCircle, 
                gender === 'all' && [styles.radioCircleSelected, { borderColor: colors.primary }]
              ]}>
                {gender === 'all' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.radioText, { color: colors.text.primary }]}>All Genders</Text>
            </TouchableOpacity>
          </View>
          
          {/* Marital Status Dropdown */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Marital Status</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={[
                styles.dropdown, 
                maritalStatusDropdownVisible && styles.dropdownActive,
                { 
                  borderColor: maritalStatusDropdownVisible 
                    ? colors.primary 
                    : isDarkMode ? colors.border : '#E5E7EB',
                  borderBottomLeftRadius: maritalStatusDropdownVisible ? 0 : 8,
                  borderBottomRightRadius: maritalStatusDropdownVisible ? 0 : 8,
                }
              ]}
              onPress={() => setMaritalStatusDropdownVisible(!maritalStatusDropdownVisible)}
            >
              <Text style={[
                styles.dropdownText, 
                { color: maritalStatus === 'Select marital status' ? colors.text.tertiary : colors.text.primary }
              ]}>
                {maritalStatus}
              </Text>
              <Icon 
                name={maritalStatusDropdownVisible ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
            
            {maritalStatusDropdownVisible && (
              <View 
                style={[
                  styles.dropdownMenu,
                  { 
                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                    borderColor: isDarkMode ? colors.border : '#E5E7EB',
                  }
                ]}
              >
                {maritalStatusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.dropdownItem,
                      { 
                        backgroundColor: maritalStatus === option.label 
                          ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#F3F4F6' 
                          : 'transparent'
                      }
                    ]}
                    onPress={() => handleMaritalStatusSelect(option)}
                  >
                    <Text style={{ color: colors.text.primary }}>{option.label}</Text>
                    {maritalStatus === option.label && (
                      <Icon name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Age Range */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
            Age Range: {ageRange[0]} - {ageRange[1]} years
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>18 years</Text>
            <View style={styles.sliderWrapper}>
              <View style={[styles.sliderTrack, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
              <View 
                style={[
                  styles.sliderFill, 
                  { 
                    left: `${((ageRange[0] - 18) / 62) * 100}%`, 
                    width: `${((ageRange[1] - ageRange[0]) / 62) * 100}%`,
                    backgroundColor: colors.primary
                  }
                ]} 
              />
            </View>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>80 years</Text>
          </View>
          
          {/* Location */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Location</Text>
          <View style={[styles.inputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}>
            <TextInput
              placeholder="Enter city, state, or country"
              placeholderTextColor={colors.text.tertiary}
              style={[styles.input, { color: colors.text.primary }]}
              value={location}
              onChangeText={setLocation}
            />
          </View>
          
          {/* Professions */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Professions</Text>
          <View style={styles.professionsGrid}>
            {professions.map(profession => (
              <TouchableOpacity
                key={profession}
                style={[
                  styles.professionCheckbox,
                  selectedProfessions.includes(profession) && styles.professionCheckboxSelected
                ]}
                onPress={() => toggleProfession(profession)}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: isDarkMode ? colors.border : '#D1D5DB' },
                  selectedProfessions.includes(profession) && [
                    styles.checkboxSelected, 
                    { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]
                ]}>
                  {selectedProfessions.includes(profession) && (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[
                  styles.professionText,
                  { color: colors.text.primary }
                ]}>
                  {profession}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Target Audience Size */}
          <View style={styles.audienceSizeContainer}>
            <Text style={[styles.audienceSizeLabel, { color: colors.text.secondary }]}>
              Target Audience Size: 50K people
            </Text>
            <View style={styles.audienceSizeSlider}>
              <View style={[styles.audienceSizeTrack, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
              <View style={[styles.audienceSizeFill, { width: '60%', backgroundColor: colors.primary }]} />
              <View style={[styles.audienceSizeHandle, { 
                backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                borderColor: colors.primary 
              }]} />
            </View>
          </View>
        </View>
        
        {/* Budget & Schedule Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="dollar-sign" size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Budget & Schedule</Text>
          </View>
          
          {/* Campaign Budget */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Campaign Budget</Text>
          <View style={styles.budgetContainer}>
            <View style={styles.budgetSliderContainer}>
              <Text style={[styles.budgetValue, { color: colors.text.primary }]}>${budget}</Text>
              <View style={styles.budgetRange}>
                <Text style={[styles.budgetRangeText, { color: colors.text.tertiary }]}>
                  Suggested budget: $500 - $5,000
                </Text>
              </View>
              <View style={styles.budgetSlider}>
                <View style={[styles.budgetSliderTrack, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
                <View style={[styles.budgetSliderFill, { 
                  width: `${(budget / 5000) * 100}%`,
                  backgroundColor: colors.primary 
                }]} />
                <View style={[styles.budgetSliderHandle, { 
                  backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                  borderColor: colors.primary
                }]} />
              </View>
            </View>
          </View>
          
          {/* Campaign Duration */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Campaign Duration</Text>
          <TouchableOpacity 
            style={[styles.dropdown, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}
            onPress={() => {/* Open dropdown */}}
          >
            <Text style={[styles.dropdownText, { color: colors.text.primary }]}>
              {duration}
            </Text>
            <Icon name="chevron-down" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          
          {/* Budget Breakdown */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Budget Breakdown</Text>
          <View style={styles.budgetBreakdown}>
            <View style={styles.budgetBreakdownRow}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.secondary }]}>
                Daily Budget:
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.text.primary }]}>
                $142.86
              </Text>
            </View>
            <View style={styles.budgetBreakdownRow}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.secondary }]}>
                Platform Fee (5%):
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.text.primary }]}>
                $50.00
              </Text>
            </View>
            <View style={styles.budgetBreakdownRow}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.secondary }]}>
                Ad Spend:
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.text.primary }]}>
                $950.00
              </Text>
            </View>
          </View>
        </View>
        
        {/* Campaign Summary */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="clipboard" size={20} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Campaign Summary</Text>
          </View>
          
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Target Audience</Text>
            <View style={styles.summaryItemsContainer}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Gender:</Text>
                <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                  {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Age Range:</Text>
                <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                  {ageRange[0]}-{ageRange[1]} years
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Location:</Text>
                <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                  {location || 'Not specified'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Professions:</Text>
                <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                  {selectedProfessions.length > 0 ? `${selectedProfessions.length} selected` : 'None'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Marital Status:</Text>
                <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                  {maritalStatus === 'Select marital status' ? 'Not specified' : maritalStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Estimated Performance */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="bar-chart-2" size={20} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Estimated Performance</Text>
          </View>
          
          <View style={styles.performanceMetrics}>
            <View style={styles.performanceMetric}>
              <Text style={[styles.performanceValue, { color: colors.primary }]}>15,000</Text>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>Estimated Reach</Text>
            </View>
            <View style={styles.performanceMetric}>
              <Text style={[styles.performanceValue, { color: '#10B981' }]}>750</Text>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>Estimated Clicks</Text>
            </View>
            <View style={styles.performanceMetric}>
              <Text style={[styles.performanceValue, { color: '#F59E0B' }]}>$1.27</Text>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>Cost Per Click</Text>
            </View>
            <View style={styles.performanceMetric}>
              <Text style={[styles.performanceValue, { color: '#10B981' }]}>3.2%</Text>
              <Text style={[styles.performanceLabel, { color: colors.text.secondary }]}>Engagement Rate</Text>
            </View>
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={[styles.launchButton, { backgroundColor: colors.primary }]}
            onPress={handleLaunchCampaign}
          >
            <Text style={[styles.launchButtonText, { color: isDarkMode ? '#000' : '#FFFFFF' }]}>
              Launch Campaign
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}
            onPress={handleSaveAsDraft}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>Save as Draft</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}
            onPress={handlePreviewAd}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>Preview Ad</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dropdownActive: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownMenu: {
    position: 'relative',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  
  // Core styles
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1F2937',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  professionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  professionCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  professionCheckboxSelected: {},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  professionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  audienceSizeContainer: {
    marginTop: 8,
  },
  audienceSizeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  audienceSizeSlider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 16,
  },
  audienceSizeTrack: {
    position: 'absolute',
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  audienceSizeFill: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  audienceSizeHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    top: -7,
    left: '60%',
    marginLeft: -10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sliderWrapper: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  budgetContainer: {
    marginBottom: 16,
  },
  budgetSliderContainer: {
    marginBottom: 16,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  budgetRange: {
    marginBottom: 12,
  },
  budgetRangeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  budgetSlider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
  },
  budgetSliderTrack: {
    position: 'absolute',
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  budgetSliderFill: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  budgetSliderHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    top: -7,
    left: '20%',
    marginLeft: -10,
  },
  budgetBreakdown: {
    marginBottom: 8,
  },
  budgetBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetBreakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  budgetBreakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  summaryContainer: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  summaryItemsContainer: {},
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryItemLabel: {
    width: 100,
    fontSize: 14,
    color: '#6B7280',
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  performanceMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  performanceMetric: {
    width: '50%',
    marginBottom: 16,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  launchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default CreateCampaignScreen;