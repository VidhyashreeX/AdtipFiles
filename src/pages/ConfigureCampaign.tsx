import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import Select from 'react-select';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { 
  apiSaveFirstPageAdModel, 
  apiGetTargetAreas,
  apiGetTargetProfessions,
  apiGetButtons,
  apiGetCompanyList
} from '@/api';

// Custom styles for react-select with dark mode
const getSelectStyles = (isDark: boolean) => ({
  control: (base: any) => ({
    ...base,
    minHeight: '48px',
    borderRadius: '12px',
    border: 'none',
    boxShadow: 'none',
    background: isDark 
      ? 'linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))' 
      : 'linear-gradient(to right, rgb(249, 250, 251), rgb(243, 244, 246))',
    '&:hover': {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused 
      ? (isDark ? 'rgba(0, 220, 170, 0.2)' : 'rgba(0, 220, 170, 0.1)')
      : 'transparent',
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: isDark ? 'rgba(0, 220, 170, 0.3)' : 'rgba(0, 220, 170, 0.2)',
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
  }),
  input: (base: any) => ({
    ...base,
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
  }),
});

const ConfigureCampaign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedModel = location.state?.selectedModel;
  
  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Extract price from selectedModel
  const modelPrice = selectedModel?.price ? parseFloat(selectedModel.price.replace('₹', '')) : 0.20;

  // State for API data and loading
  const [isLoading, setIsLoading] = useState(false);
  const [targetAreas, setTargetAreas] = useState<any[]>([]);
  const [targetProfessions, setTargetProfessions] = useState<any[]>([]);
  const [buttons, setButtons] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    campaignName: '',
    campaignDescription: '',
    selectedCompany: '',
    companyId: '',
    targetGender: '',
    targetAge: '',
    targetMaritalStatus: '',
    targetProfession: '',
    targetAreas: {
      delhi: false,
      mumbai: false,
      chennai: false,
      bangalore: false,
      hyderabad: false,
      kolkata: false
    },
    customLocation: '',
    watchesPerCustomerPerDay: '',
    amountPerCustomer: '',
    customersPerDay: '',
    amountPerDay: '',
    campaignDuration: '',
    estimatedTotalAmount: 0,
    startDateTime: null as Date | null,
    endDateTime: null as Date | null,
    customerViewPercentage: 50,
    customerLikePercentage: 30,
    buttonToDisplay: '',
    buttonLink: '',
    adDisplayLocation: '',
    selectedPlatform: '',
    transactionId: ''
  });

  // Calculate estimated amount
  useEffect(() => {
    const { amountPerCustomer, customersPerDay, campaignDuration } = formData;
    
    if (amountPerCustomer && customersPerDay && campaignDuration) {
      const dailyAmount = parseFloat(amountPerCustomer) * parseFloat(customersPerDay);
      const totalAmount = dailyAmount * parseFloat(campaignDuration);
      
      setFormData(prev => ({
        ...prev,
        amountPerDay: dailyAmount.toString(),
        estimatedTotalAmount: totalAmount
      }));
    }
  }, [formData.amountPerCustomer, formData.customersPerDay, formData.campaignDuration]);

  // Auto-calculate end date
  useEffect(() => {
    if (formData.startDateTime && formData.campaignDuration) {
      const startDate = new Date(formData.startDateTime);
      const duration = parseInt(formData.campaignDuration);
      
      if (!isNaN(startDate.getTime()) && duration > 0) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);
        
        setFormData(prev => ({
          ...prev,
          endDateTime: endDate
        }));
      }
    }
  }, [formData.startDateTime, formData.campaignDuration]);

  // Load API data
  useEffect(() => {
    const loadApiData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.id || localStorage.getItem('userId') || '1';
        
        const [areasRes, professionsRes, buttonsRes, companiesRes] = await Promise.all([
          apiGetTargetAreas(),
          apiGetTargetProfessions(),
          apiGetButtons(),
          apiGetCompanyList(userId)
        ]);
        
        if (areasRes.data?.status === 200) setTargetAreas(areasRes.data.data || []);
        if (professionsRes.data?.status === 200) setTargetProfessions(professionsRes.data.data || []);
        if (buttonsRes.data?.status === 200) setButtons(buttonsRes.data.data || []);
        if (companiesRes.data?.status === 200) {
          const companiesList = companiesRes.data.data || [];
          setCompanies(companiesList);
          
          if (companiesList.length > 0 && !formData.selectedCompany) {
            setFormData(prev => ({
              ...prev,
              selectedCompany: companiesList[0].name || '',
              companyId: companiesList[0].id?.toString() || ''
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load API data:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign options. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    loadApiData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRangeChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTargetAreaChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      targetAreas: {
        ...prev.targetAreas,
        [area]: checked
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.campaignName.trim()) newErrors.campaignName = 'Campaign name is required';
    if (!formData.targetGender) newErrors.targetGender = 'Target gender is required';
    if (!formData.targetMaritalStatus) newErrors.targetMaritalStatus = 'Marital status is required';
    if (!formData.targetProfession) newErrors.targetProfession = 'Target profession is required';
    
    const hasTargetArea = Object.values(formData.targetAreas).some(Boolean) || formData.customLocation.trim();
    if (!hasTargetArea) newErrors.targetAreas = 'Select at least one target area';
    
    if (!formData.amountPerCustomer || parseFloat(formData.amountPerCustomer) <= 0) {
      newErrors.amountPerCustomer = 'Amount per customer must be greater than 0';
    }
    if (!formData.customersPerDay || parseFloat(formData.customersPerDay) <= 0) {
      newErrors.customersPerDay = 'Customers per day must be greater than 0';
    }
    if (!formData.campaignDuration || parseFloat(formData.campaignDuration) <= 0) {
      newErrors.campaignDuration = 'Campaign duration must be greater than 0';
    }
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const companyData = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
      
      // Format dates
      const startDate = formData.startDateTime ? new Date(formData.startDateTime).toISOString().slice(0, 19).replace('T', ' ') : '';
      const endDate = formData.endDateTime ? new Date(formData.endDateTime).toISOString().slice(0, 19).replace('T', ' ') : '';
      
      const campaignApiData = {
        campaignName: formData.campaignName,
        companyName: companyData.name || formData.selectedCompany,
        companyId: companyData.id || formData.companyId || '1',
        adModelId: selectedModel?.id || 1,
        targetGender: formData.targetGender,
        maritalStatus: formData.targetMaritalStatus,
        targetLowerAge: parseInt(formData.targetAge?.split('-')[0] || '18'),
        targetUpperAge: parseInt(formData.targetAge?.split('-')[1] || '65'),
        targetProfessions: formData.targetProfession,
        targetArea: Object.entries(formData.targetAreas)
          .filter(([_, selected]) => selected)
          .map(([area, _]) => area)
          .concat(formData.customLocation ? [formData.customLocation] : [])
          .join(','),
        adwatchPerDay: parseInt(formData.watchesPerCustomerPerDay || '1'),
        adPerdayPay: parseFloat(formData.amountPerCustomer || '0'),
        adSpendPerDay: parseFloat(formData.amountPerDay || '0'),
        adStartDate: startDate,
        adEndDate: endDate,
        adTime: formData.startDateTime ? new Date(formData.startDateTime).toTimeString().slice(0, 5) : '09:00',
        adEndTime: formData.endDateTime ? new Date(formData.endDateTime).toTimeString().slice(0, 5) : '18:00',
        adCustomerTargetPerDay: parseInt(formData.customersPerDay || '0'),
        modelTypeName: selectedModel?.title || 'Skip Video Ad',
        createdby: userData.id || '1'
      };

      console.log('Sending campaign data:', campaignApiData);
      
      const response = await apiSaveFirstPageAdModel(campaignApiData);
      
      if (response.data?.status === 200 && response.data.data?.[0]?.id) {
        const adId = response.data.data[0].id;
        
        toast({
          title: "Success!",
          description: "Campaign details saved successfully!",
        });
        
        navigate('/seller/upload-creative', { 
          state: { 
            selectedModel, 
            campaignData: formData,
            adId: adId,
            apiData: campaignApiData
          } 
        });
      } else {
        throw new Error(response.data?.message || 'Failed to save campaign details');
      }
      
    } catch (error: any) {
      console.error('Campaign creation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save campaign details';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Options for react-select
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'all', label: 'All' }
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'all', label: 'All' }
  ];

  const ageOptions = [
    { value: 'all', label: 'All Ages' },
    { value: '18-25', label: '18-25' },
    { value: '26-35', label: '26-35' },
    { value: '36-45', label: '36-45' },
    { value: '46-55', label: '46-55' },
    { value: '56-65', label: '56-65' },
    { value: '65+', label: '65+' }
  ];

  const professionOptions = [
    { value: 'student', label: 'Student' },
    { value: 'employed', label: 'Employed' },
    { value: 'business', label: 'Business Owner' },
    { value: 'professional', label: 'Professional' },
    { value: 'retired', label: 'Retired' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'housewife', label: 'Housewife' },
    { value: 'other', label: 'Other' }
  ];

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300" 
                      onClick={() => navigate('/post-ads')}
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Campaign Setup</h1>
                      <p className="text-white/90">Configure your {selectedModel?.title || 'Ad'} campaign</p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <span className="text-white font-bold text-lg">₹{modelPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form className="p-8">
                
                {/* Basic Information */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        name="campaignName"
                        value={formData.campaignName}
                        onChange={handleInputChange}
                        placeholder="Enter campaign name"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Campaign Description
                      </label>
                      <textarea
                        name="campaignDescription"
                        value={formData.campaignDescription}
                        onChange={handleInputChange}
                        placeholder="Describe your campaign"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Company & Demographics */}
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Company
                      </label>
                      <Select
                        options={companyOptions}
                        styles={getSelectStyles(isDarkMode)}
                        placeholder="Choose company"
                        value={companyOptions.find(opt => opt.value === formData.companyId)}
                        onChange={(selected) => {
                          const company = companies.find(c => c.id === selected?.value);
                          setFormData(prev => ({
                            ...prev,
                            selectedCompany: company?.name || '',
                            companyId: company?.id?.toString() || ''
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Gender
                      </label>
                      <Select
                        options={genderOptions}
                        styles={getSelectStyles(isDarkMode)}
                        placeholder="Select gender"
                        value={genderOptions.find(opt => opt.value === formData.targetGender)}
                        onChange={(selected) => setFormData(prev => ({ ...prev, targetGender: selected?.value || '' }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Marital Status & Age */}
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Marital Status
                      </label>
                      <Select
                        options={maritalStatusOptions}
                        styles={getSelectStyles(isDarkMode)}
                        placeholder="Select marital status"
                        value={maritalStatusOptions.find(opt => opt.value === formData.targetMaritalStatus)}
                        onChange={(selected) => setFormData(prev => ({ ...prev, targetMaritalStatus: selected?.value || '' }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Age
                      </label>
                      <Select
                        options={ageOptions}
                        styles={getSelectStyles(isDarkMode)}
                        placeholder="Select age range"
                        value={ageOptions.find(opt => opt.value === formData.targetAge)}
                        onChange={(selected) => setFormData(prev => ({ ...prev, targetAge: selected?.value || '' }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Profession */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Profession
                  </label>
                  <Select
                    options={professionOptions}
                    styles={getSelectStyles(isDarkMode)}
                    placeholder="Select profession"
                    value={professionOptions.find(opt => opt.value === formData.targetProfession)}
                    onChange={(selected) => setFormData(prev => ({ ...prev, targetProfession: selected?.value || '' }))}
                  />
                </div>

                {/* Target Areas */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Target Areas
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {[
                      { id: 'delhi', label: 'Delhi' },
                      { id: 'mumbai', label: 'Mumbai' },
                      { id: 'chennai', label: 'Chennai' },
                      { id: 'bangalore', label: 'Bangalore' },
                      { id: 'hyderabad', label: 'Hyderabad' },
                      { id: 'kolkata', label: 'Kolkata' }
                    ].map((area) => (
                      <label key={area.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.targetAreas[area.id as keyof typeof formData.targetAreas]}
                          onChange={(e) => handleTargetAreaChange(area.id, e.target.checked)}
                          className="w-4 h-4 text-[#00dcaa] bg-gray-100 dark:bg-gray-700 border-0 rounded focus:ring-2 focus:ring-[#00dcaa]/50"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{area.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <input
                    type="text"
                    name="customLocation"
                    value={formData.customLocation}
                    onChange={handleInputChange}
                    placeholder="Add custom location"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Engagement Details */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Watches per customer per day
                      </label>
                      <input
                        type="number"
                        name="watchesPerCustomerPerDay"
                        value={formData.watchesPerCustomerPerDay}
                        onChange={handleInputChange}
                        placeholder="Enter number"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount per customer (₹)
                      </label>
                      <input
                        type="number"
                        name="amountPerCustomer"
                        value={formData.amountPerCustomer}
                        onChange={handleInputChange}
                        placeholder="Enter amount"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Customers per day
                      </label>
                      <input
                        type="number"
                        name="customersPerDay"
                        value={formData.customersPerDay}
                        onChange={handleInputChange}
                        placeholder="Enter number"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount per day (₹)
                      </label>
                      <input
                        type="number"
                        name="amountPerDay"
                        value={formData.amountPerDay}
                        readOnly
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Campaign duration (days)
                      </label>
                      <input
                        type="number"
                        name="campaignDuration"
                        value={formData.campaignDuration}
                        onChange={handleInputChange}
                        placeholder="Enter number of days"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Total Amount
                      </label>
                      <div className="bg-gradient-to-r from-[#00dcaa]/20 to-[#00b894]/20 dark:from-[#00dcaa]/30 dark:to-[#00b894]/30 backdrop-blur-sm rounded-xl p-3 font-bold text-[#00dcaa] dark:text-[#00dcaa]">
                        ₹{formData.estimatedTotalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date & Time
                      </label>
                      <div className="mui-date-picker-wrapper">
                        <DateTimePicker
                          value={formData.startDateTime}
                          onChange={(newValue) => setFormData(prev => ({ ...prev, startDateTime: newValue }))}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '12px',
                                  backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 1)',
                                  color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                  '& fieldset': {
                                    borderColor: isDarkMode ? 'rgba(75, 85, 99, 1)' : 'rgba(209, 213, 219, 1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: '#00dcaa',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#00dcaa',
                                  },
                                  '& input': {
                                    color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                                  },
                                },
                              },
                            },
                            popper: {
                              sx: {
                                '& .MuiPaper-root': {
                                  backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'white',
                                  color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                },
                                '& .MuiPickersDay-root': {
                                  color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                  '&:hover': {
                                    backgroundColor: isDarkMode ? 'rgba(0, 220, 170, 0.2)' : 'rgba(0, 220, 170, 0.1)',
                                  },
                                  '&.Mui-selected': {
                                    backgroundColor: '#00dcaa',
                                    '&:hover': {
                                      backgroundColor: '#00b894',
                                    },
                                  },
                                },
                                '& .MuiPickersCalendarHeader-label': {
                                  color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                },
                                '& .MuiPickersCalendarHeader-switchViewButton': {
                                  color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                                },
                                '& .MuiPickersArrowSwitcher-button': {
                                  color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                                },
                                '& .MuiClock-root': {
                                  backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'white',
                                },
                                '& .MuiClockNumber-root': {
                                  color: isDarkMode ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                },
                                '& .MuiClockPointer-root': {
                                  backgroundColor: '#00dcaa',
                                },
                                '& .MuiClockPointer-thumb': {
                                  backgroundColor: '#00dcaa',
                                  borderColor: '#00dcaa',
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date & Time <span className="text-xs text-gray-500 dark:text-gray-400">(Auto-calculated)</span>
                      </label>
                      <div className="mui-date-picker-wrapper">
                        <DateTimePicker
                          value={formData.endDateTime}
                          onChange={() => {}} // Read-only
                          disabled
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '12px',
                                  backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.3)' : 'rgba(243, 244, 246, 1)',
                                  color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                                  '& fieldset': {
                                    borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 1)',
                                  },
                                  '& input': {
                                    color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color: isDarkMode ? 'rgb(107, 114, 128)' : 'rgb(156, 163, 175)',
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Continue to Upload Creative'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
    </LocalizationProvider>
  );
};

export default ConfigureCampaign;
