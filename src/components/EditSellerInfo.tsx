import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Upload,
  ImageIcon,
  Save,
  Loader2,
  CheckCircle,
  Tag,
  User,
  FileText,
  Camera,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiUpdateCompany, apiGetCompanyList } from '@/api';
import { uploadToR2, UPLOAD_FOLDERS, UploadProgress } from '@/services/r2UploadService';

interface SellerInfo {
  id?: number;
  companyName: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  website: string;
  companyType: string;
  ctaButton: string;
  logo?: File | string | null;
  banner?: File | string | null;
  logoUrl?: string;
  bannerUrl?: string;
}

const categories = ['Products', 'Services', 'Both'];
const buttonOptions = ['Book Now', 'Visit Page', 'Know More', 'Buy Now', 'Reserve'];

const EditSellerInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<SellerInfo>({
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
    logoUrl: '',
    bannerUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState({ logo: false, banner: false });
  const [uploadProgress, setUploadProgress] = useState({ logo: 0, banner: 0 });
  const [loading, setLoading] = useState(true);

  // Load company data
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.id;

        if (!userId) {
          toast({
            title: "Error",
            description: "User not found. Please log in again.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        // Get selected company from localStorage or fetch first company
        const storedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
        
        if (storedCompany.id) {
          setFormData({
            id: storedCompany.id,
            companyName: storedCompany.name || '',
            email: storedCompany.email || '',
            phone: storedCompany.phone || '',
            location: storedCompany.location || '',
            description: storedCompany.about || storedCompany.description || '',
            website: storedCompany.website || '',
            companyType: storedCompany.industry || storedCompany.companyType || '',
            ctaButton: storedCompany.button || storedCompany.ctaButton || '',
            logoUrl: storedCompany.profileImage || storedCompany.logoUrl || '',
            bannerUrl: storedCompany.coverImage || storedCompany.bannerUrl || '',
            logo: null,
            banner: null
          });
        } else {
          // Fetch companies if no selected company
          const companiesResponse = await apiGetCompanyList(userId.toString());
          if (companiesResponse.data && companiesResponse.data.status === 200) {
            const companies = companiesResponse.data.data || [];
            if (companies.length > 0) {
              const company = companies[0];
              setFormData({
                id: company.id,
                companyName: company.name || '',
                email: company.email || '',
                phone: company.phone || '',
                location: company.location || '',
                description: company.about || company.description || '',
                website: company.website || '',
                companyType: company.industry || company.companyType || '',
                ctaButton: company.button || company.ctaButton || '',
                logoUrl: company.profileImage || company.logoUrl || '',
                bannerUrl: company.coverImage || company.bannerUrl || '',
                logo: null,
                banner: null
              });
              localStorage.setItem('selectedCompany', JSON.stringify(company));
            }
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        toast({
          title: "Error",
          description: "Failed to load company information.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.companyType) newErrors.companyType = 'Category is required';
    if (!formData.ctaButton) newErrors.ctaButton = 'Call to action button is required';
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;

      // Upload files if any
      let logoUrl = formData.logoUrl;
      let bannerUrl = formData.bannerUrl;

      if (formData.logo instanceof File) {
        setIsUploading(prev => ({ ...prev, logo: true }));
        const logoResult = await uploadToR2(
          formData.logo,
          UPLOAD_FOLDERS.COMPANIES,
          userId,
          (progress: UploadProgress) => {
            setUploadProgress(prev => ({ ...prev, logo: progress.percentage }));
          }
        );
        
        if (logoResult.success) {
          logoUrl = logoResult.url;
        } else {
          throw new Error('Failed to upload logo');
        }
        setIsUploading(prev => ({ ...prev, logo: false }));
      }

      if (formData.banner instanceof File) {
        setIsUploading(prev => ({ ...prev, banner: true }));
        const bannerResult = await uploadToR2(
          formData.banner,
          UPLOAD_FOLDERS.COMPANIES,
          userId,
          (progress: UploadProgress) => {
            setUploadProgress(prev => ({ ...prev, banner: progress.percentage }));
          }
        );
        
        if (bannerResult.success) {
          bannerUrl = bannerResult.url;
        } else {
          throw new Error('Failed to upload banner');
        }
        setIsUploading(prev => ({ ...prev, banner: false }));
      }

      // Prepare update data
      const updateData = {
        id: formData.id,
        name: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        about: formData.description,
        website: formData.website,
        industry: formData.companyType,
        button: formData.ctaButton,
        profileimage: logoUrl,
        coverimage: bannerUrl,
        userId: userId
      };

      const response = await apiUpdateCompany(updateData);
      
      if (response.data && response.data.status === 200) {
        // Update localStorage with new data
        const updatedCompany = {
          ...JSON.parse(localStorage.getItem('selectedCompany') || '{}'),
          name: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          about: formData.description,
          website: formData.website,
          industry: formData.companyType,
          button: formData.ctaButton,
          profileImage: logoUrl,
          coverImage: bannerUrl
        };
        localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));

        toast({
          title: "Success!",
          description: "Company information updated successfully!",
          variant: "default"
        });

        // Navigate back to dashboard with success message
        navigate('/seller/dashboard', { 
          state: { 
            message: 'Seller information updated successfully!',
            updatedData: updatedCompany
          }
        });
      } else {
        throw new Error(response.data?.message || 'Failed to update company information');
      }
      
    } catch (error: any) {
      console.error('Update failed:', error);
      setErrors({ submit: error.message || 'Failed to update information. Please try again.' });
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update information. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading({ logo: false, banner: false });
    }
  };

  const handleFileUpload = (field: 'logo' | 'banner', file: File) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Company Information</h3>
          <p className="text-gray-600">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors duration-200 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-teal-500 rounded-2xl shadow-lg">
                <Settings className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Edit Company Profile</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Update your company information to attract more customers and build credibility
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-teal-600 px-8 py-8">
            <h2 className="text-2xl font-bold text-white mb-2">Company Information</h2>
            <p className="text-indigo-100">Keep your business profile current and engaging</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Basic Information
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1 text-blue-500" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter your company name"
                  />
                  {errors.companyName && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1 text-green-500" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="company@example.com"
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1 text-purple-500" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-orange-500" />
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="City, State/Country"
                  />
                  {errors.location && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1 text-indigo-500" />
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1 text-pink-500" />
                    Category *
                  </label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                    title="Select company category"
                  >
                    <option value="">Select Category</option>
                    {categories.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.companyType && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.companyType}</p>}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Company Description
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  About the Company *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-32 resize-none transition-all duration-200"
                  placeholder="Describe your company, what you do, your mission, and what makes you unique..."
                />
                {errors.description && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.description}</p>}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Customer Action
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Call to Action Button *
                </label>
                <select
                  value={formData.ctaButton}
                  onChange={(e) => setFormData({ ...formData, ctaButton: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  title="Select call to action button text"
                >
                  <option value="">Select Button Text</option>
                  {buttonOptions.map((button) => (
                    <option key={button} value={button}>{button}</option>
                  ))}
                </select>
                {errors.ctaButton && <p className="text-sm text-red-500 mt-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.ctaButton}</p>}
              </div>
            </div>

            {/* File Uploads Section */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Brand Assets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company Logo
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('logo', file);
                    }}
                    className="hidden"
                    title="Upload company logo"
                    aria-label="Upload company logo"
                  />
                  {isUploading.logo ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-blue-600">Uploading logo...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
                          data-progress={uploadProgress.logo}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{uploadProgress.logo}% complete</p>
                    </div>
                  ) : formData.logoUrl || formData.logo ? (
                    <div className="space-y-2">
                      {formData.logoUrl && (
                        <img 
                          src={formData.logoUrl} 
                          alt="Company Logo" 
                          className="w-16 h-16 object-cover rounded-full mx-auto border-2 border-green-500"
                        />
                      )}
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                      <p className="text-sm text-green-600">
                        {formData.logo instanceof File ? formData.logo.name : 'Current logo'}
                      </p>
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">Click to upload logo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company Banner
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 border-green-300 hover:border-green-500 hover:bg-green-50"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('banner', file);
                    }}
                    className="hidden"
                    title="Upload company banner"
                    aria-label="Upload company banner"
                  />
                  {isUploading.banner ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-blue-600">Uploading banner...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
                          data-progress={uploadProgress.banner}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{uploadProgress.banner}% complete</p>
                    </div>
                  ) : formData.bannerUrl || formData.banner ? (
                    <div className="space-y-2">
                      {formData.bannerUrl && (
                        <img 
                          src={formData.bannerUrl} 
                          alt="Company Banner" 
                          className="w-full h-16 object-cover rounded-lg mx-auto border-2 border-green-500"
                        />
                      )}
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                      <p className="text-sm text-green-600">
                        {formData.banner instanceof File ? formData.banner.name : 'Current banner'}
                      </p>
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">Click to upload banner</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="bg-gray-50 rounded-lg p-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/seller/dashboard')}
                  className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading.logo || isUploading.banner}
                  className={`flex items-center justify-center px-8 py-3 rounded-xl text-white font-medium transition-all duration-200 ${
                    isSubmitting || isUploading.logo || isUploading.banner
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting || isUploading.logo || isUploading.banner ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isUploading.logo || isUploading.banner ? 'Uploading Files...' : 'Saving Changes...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

            {errors.submit && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-6">
                <p className="text-red-600 font-medium flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  {errors.submit}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSellerInfo;