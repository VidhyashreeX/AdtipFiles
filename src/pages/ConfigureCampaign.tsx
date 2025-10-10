import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  apiSaveFirstPageAdModel, 
  apiSaveSecondPageAdModel, 
  apiSaveThirdPageAdModel,
  apiGetTargetAreas,
  apiGetTargetProfessions,
  apiGetButtons
} from '@/api';

const ConfigureCampaign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedModel = location.state?.selectedModel;

  // Extract price from selectedModel (remove ₹ symbol and convert to number)
  const modelPrice = selectedModel?.price ? parseFloat(selectedModel.price.replace('₹', '')) : 0.20;

  // State for API data and loading
  const [isLoading, setIsLoading] = useState(false);
  const [targetAreas, setTargetAreas] = useState<any[]>([]);
  const [targetProfessions, setTargetProfessions] = useState<any[]>([]);
  const [buttons, setButtons] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Basic Information
    campaignName: '',
    campaignDescription: '',
    
    // Company Selection
    selectedCompany: '',
    
    // Target Demographics
    targetGender: '',
    targetAge: '',
    targetMaritalStatus: '',
    targetProfession: '',
    
    // Target Areas
    targetAreas: {
      delhi: false,
      mumbai: false,
      chennai: false,
      bangalore: false,
      hyderabad: false,
      kolkata: false
    },
    customLocation: '',
    
    // Engagement Details
    watchesPerCustomerPerDay: '',
    amountPerCustomer: '',
    customersPerDay: '',
    amountPerDay: '',
    campaignDuration: '',
    estimatedTotalAmount: 0,
    startDateTime: '',
    endDateTime: '',
    
    // Customer Conversion & Button Setup
    customerViewPercentage: 50,
    customerLikePercentage: 30,
    buttonToDisplay: '',
    buttonLink: '',
    adDisplayLocation: '',
    selectedPlatform: '',
    transactionId: ''
  });

  // Calculate estimated amount whenever relevant fields change
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // Load API data on component mount
  useEffect(() => {
    const loadApiData = async () => {
      try {
        const [areasRes, professionsRes, buttonsRes] = await Promise.all([
          apiGetTargetAreas(),
          apiGetTargetProfessions(),
          apiGetButtons()
        ]);
        
        if (areasRes.data?.status === 200) setTargetAreas(areasRes.data.data || []);
        if (professionsRes.data?.status === 200) setTargetProfessions(professionsRes.data.data || []);
        if (buttonsRes.data?.status === 200) setButtons(buttonsRes.data.data || []);
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

  // Load company data from localStorage
  useEffect(() => {
    const companyData = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
    if (companyData && companyData.id) {
      setFormData(prev => ({
        ...prev,
        selectedCompany: companyData.name || '',
        companyId: companyData.id.toString()
      }));
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.campaignName.trim()) newErrors.campaignName = 'Campaign name is required';
    if (!formData.targetGender) newErrors.targetGender = 'Target gender is required';
    if (!formData.targetMaritalStatus) newErrors.targetMaritalStatus = 'Marital status is required';
    if (!formData.targetProfession) newErrors.targetProfession = 'Target profession is required';
    
    // Check if at least one target area is selected
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
    if (!formData.endDateTime) newErrors.endDateTime = 'End date is required';

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
      // Get user data
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const companyData = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
      
      // Prepare data for first page API call
      const campaignApiData = {
        campaignName: formData.campaignName,
        companyName: companyData.name || formData.selectedCompany,
        companyId: companyData.id || '1',
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
        adStartDate: formData.startDateTime,
        adEndDate: formData.endDateTime,
        adTime: '09:00',
        adEndTime: '18:00',
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
        
        // Navigate to upload creative with the ad ID
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

  return (
    <div className="min-h-screen bg-[#f5f5ff] dark:bg-gray-950">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border dark:border-gray-800">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors" 
                  onClick={() => navigate('/post-ads')}
                  title="Back to Ad Models"
                  aria-label="Back to Ad Models"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Campaign Setup</h1>
                  <p className="text-white/80">Configure your {selectedModel?.title || 'Ad'} campaign</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Description
                  </label>
                  <textarea
                    name="campaignDescription"
                    value={formData.campaignDescription}
                    onChange={handleInputChange}
                    placeholder="Describe your campaign"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            {/* Select Company & Target Gender */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Company
                  </label>
                  <select
                    name="selectedCompany"
                    value={formData.selectedCompany}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  >
                    <option value="">Choose company</option>
                    <option value="company1">Company 1</option>
                    <option value="company2">Company 2</option>
                    <option value="company3">Company 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Gender
                  </label>
                  <select
                    name="targetGender"
                    value={formData.targetGender}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Marital Status & Target Age */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Marital Status
                  </label>
                  <select
                    name="targetMaritalStatus"
                    value={formData.targetMaritalStatus}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  >
                    <option value="">Select marital status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Age
                  </label>
                  <select
                    name="targetAge"
                    value={formData.targetAge}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  >
                    <option value="">Select age range</option>
                    <option value="all">All Ages</option>
                    <option value="18-25">18-25</option>
                    <option value="26-35">26-35</option>
                    <option value="36-45">36-45</option>
                    <option value="46-55">46-55</option>
                    <option value="56-65">56-65</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Profession */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Profession
              </label>
              <select
                name="targetProfession"
                value={formData.targetProfession}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
              >
                <option value="">Select profession</option>
                <option value="student">Student</option>
                <option value="employed">Employed</option>
                <option value="business">Business Owner</option>
                <option value="professional">Professional</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
                <option value="housewife">Housewife</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Target Areas */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
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
                  <label key={area.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetAreas[area.id as keyof typeof formData.targetAreas]}
                      onChange={(e) => handleTargetAreaChange(area.id, e.target.checked)}
                      className="w-4 h-4 text-[#00dcaa] border-gray-300 rounded focus:ring-[#00dcaa]"
                    />
                    <span className="text-sm font-medium text-gray-700">{area.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  name="customLocation"
                  value={formData.customLocation}
                  onChange={handleInputChange}
                  placeholder="Add custom location"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                />
                <button
                  type="button"
                  className="bg-[#00dcaa] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#00b894] transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Engagement Details Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Details</h3>
              <p className="text-sm text-gray-600 mb-6">Configure your campaign engagement and budget settings</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Watches per customer per day
                  </label>
                  <input
                    type="number"
                    name="watchesPerCustomerPerDay"
                    value={formData.watchesPerCustomerPerDay}
                    onChange={handleInputChange}
                    placeholder="Enter number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount per customer (₹)
                  </label>
                  <input
                    type="number"
                    name="amountPerCustomer"
                    value={formData.amountPerCustomer}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customers per day
                  </label>
                  <input
                    type="number"
                    name="customersPerDay"
                    value={formData.customersPerDay}
                    onChange={handleInputChange}
                    placeholder="Enter number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount per day (₹)
                  </label>
                  <input
                    type="number"
                    name="amountPerDay"
                    value={formData.amountPerDay}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign duration (days)
                  </label>
                  <input
                    type="number"
                    name="campaignDuration"
                    value={formData.campaignDuration}
                    onChange={handleInputChange}
                    placeholder="Enter number of days"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Total Amount
                  </label>
                  <div className="bg-[#00dcaa]/10 border border-[#00dcaa]/30 rounded-lg p-3 font-bold text-[#00dcaa]">
                    ₹{formData.estimatedTotalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    value={formData.startDateTime}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    value={formData.endDateTime}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Customer Conversion & Button Setup */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Conversion & Button Setup</h3>
              <p className="text-sm text-gray-600 mb-6">Configure conversion rates and call-to-action buttons</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Customer per view percentage: {formData.customerViewPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.customerViewPercentage}
                    onChange={(e) => handleRangeChange('customerViewPercentage', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #00dcaa 0%, #00dcaa ${formData.customerViewPercentage}%, #e5e7eb ${formData.customerViewPercentage}%, #e5e7eb 100%)`
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Customer per like percentage: {formData.customerLikePercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.customerLikePercentage}
                    onChange={(e) => handleRangeChange('customerLikePercentage', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #00dcaa 0%, #00dcaa ${formData.customerLikePercentage}%, #e5e7eb ${formData.customerLikePercentage}%, #e5e7eb 100%)`
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Button to Display
                    </label>
                    <select
                      name="buttonToDisplay"
                      value={formData.buttonToDisplay}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    >
                      <option value="">Choose button type</option>
                      <option value="buy-now">Buy Now</option>
                      <option value="learn-more">Learn More</option>
                      <option value="sign-up">Sign Up</option>
                      <option value="download">Download</option>
                      <option value="call-now">Call Now</option>
                      <option value="visit-website">Visit Website</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Link (Optional)
                    </label>
                    <input
                      type="url"
                      name="buttonLink"
                      value={formData.buttonLink}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where to Display Ad?
                    </label>
                    <select
                      name="adDisplayLocation"
                      value={formData.adDisplayLocation}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    >
                      <option value="">Choose display location</option>
                      <option value="feed">News Feed</option>
                      <option value="stories">Stories</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="banner">Banner</option>
                      <option value="video-ads">Video Ads</option>
                      <option value="search-results">Search Results</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID / GST Number
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    placeholder="Enter transaction ID or GST number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleContinue}
                className="bg-[#00dcaa] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#00b894] transition-colors shadow-lg"
              >
                Continue to Upload Creative
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfigureCampaign;