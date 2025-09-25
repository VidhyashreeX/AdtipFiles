import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  ArrowRight, 
  Upload,
  ImageIcon,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiCreateCompany } from '@/api';

interface FormData {
  companyName: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  website: string;
  companyType: string;
  ctaButton: string;
  logo: File | null;
  banner: File | null;
}

const STEPS = [
  { id: 1, title: 'Create Company Page', subtitle: 'Fill the information to use the exclusive features in advertiser panel.' },
  { id: 2, title: 'Create Company Page', subtitle: 'Fill the information to use the exclusive features in advertiser panel.' },
  { id: 3, title: 'Last One', subtitle: 'Fill the information to use the exclusive features in advertiser panel.' },
];

const categories = ['Products', 'Services', 'Both'];

const buttonOptions = [
  'Book Now',
  'Visit Page', 
  'Know More',
  'Buy Now',
  'Reserve'
];

const SellerRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    website: '',
    companyType: '',
    ctaButton: '',
    logo: null,
    banner: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
    } else if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Company description is required';
      if (!formData.companyType) newErrors.companyType = 'Category is required';
      if (!formData.ctaButton) newErrors.ctaButton = 'Call to action button is required';
    } else if (step === 3) {
      if (!formData.logo) newErrors.logo = 'Company logo is required';
      if (!formData.banner) newErrors.banner = 'Company banner is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Create company using the backend API
      const response = await apiCreateCompany(formData);
      
      if (response.data && response.data.status === 200) {
        // Store company info in localStorage for later use
        const companyData = response.data.data[0];
        localStorage.setItem('selectedCompany', JSON.stringify(companyData));
        
        toast({
          title: "Success!",
          description: "Company registration completed successfully! Welcome to AdTip.",
        });
        
        // Navigate to seller dashboard on success
        navigate('/seller/dashboard', { 
          state: { 
            message: 'Seller registration completed successfully! Welcome to AdTip.',
            newSeller: true,
            companyData: companyData
          }
        });
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific backend error
      let errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      
      if (errorMessage.includes('coverimage is not defined')) {
        errorMessage = 'Server configuration error. Please contact support or try again later.';
        console.error('Backend bug detected: coverimage variable not defined in SQL query. This is a backend issue that needs to be fixed.');
      }
      
      setErrors({ submit: errorMessage });
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Name of the company *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Enter your company name"
                required
              />
              {errors.companyName && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.companyName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Company Contact Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Enter your company email"
                required
              />
              {errors.email && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Company Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Enter your phone number"
                required
              />
              {errors.phone && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.phone}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="City, State/Country"
                required
              />
              {errors.location && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.location}</p>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                About the company *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] h-32 resize-none transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tell us about your company"
                required
              />
              {errors.description && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="https://your-website.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Category *
              </label>
              <select
                value={formData.companyType}
                onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.companyType && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.companyType}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Select Call to Action Button *
              </label>
              <select
                value={formData.ctaButton || ''}
                onChange={(e) => setFormData({ ...formData, ctaButton: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00dcaa] focus:border-[#00dcaa] transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              >
                <option value="">Select Button Text</option>
                {buttonOptions.map((button) => (
                  <option key={button} value={button}>{button}</option>
                ))}
              </select>
              {errors.ctaButton && <p className="text-sm text-red-500 mt-2 flex items-center"><span className="mr-1">⚠️</span>{errors.ctaButton}</p>}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Company Logo *
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = Array.from(e.dataTransfer.files);
                  const imageFile = files.find(file => file.type.startsWith('image/'));
                  if (imageFile) {
                    setFormData({ ...formData, logo: imageFile });
                  }
                }}
                onClick={() => logoInputRef.current?.click()}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, logo: file });
                    }
                  }}
                  className="hidden"
                />
                {formData.logo ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <ImageIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-600">{formData.logo.name}</p>
                    <p className="text-xs text-gray-500">✅ Logo uploaded successfully</p>
                    <p className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>
              {errors.logo && <p className="text-sm text-red-500 mt-3 flex items-center"><span className="mr-1">⚠️</span>{errors.logo}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Company Banner *
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = Array.from(e.dataTransfer.files);
                  const imageFile = files.find(file => file.type.startsWith('image/'));
                  if (imageFile) {
                    setFormData({ ...formData, banner: imageFile });
                  }
                }}
                onClick={() => bannerInputRef.current?.click()}
              >
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, banner: file });
                    }
                  }}
                  className="hidden"
                />
                {formData.banner ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <ImageIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-600">{formData.banner.name}</p>
                    <p className="text-xs text-gray-500">✅ Banner uploaded successfully</p>
                    <p className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
              {errors.banner && <p className="text-sm text-red-500 mt-3 flex items-center"><span className="mr-1">⚠️</span>{errors.banner}</p>}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5ff] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Seller Registration</h1>
          </div>
          <p className="text-gray-500 text-lg">{STEPS[currentStep - 1].subtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-center items-center mb-6">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : currentStep === step.id 
                    ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-200' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-20 h-1 mx-3 rounded-full transition-all duration-300 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{STEPS[currentStep - 1].title}</h2>
            <p className="text-gray-500">Step {currentStep} of {STEPS.length}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={nextStep}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white rounded-xl font-semibold hover:from-[#00b894] hover:to-[#00a085] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] hover:shadow-xl'
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Complete Registration
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>

        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRegistration;