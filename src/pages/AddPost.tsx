import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Image as ImageIcon, Video, FileText, Calendar, Target, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiSavePost, apiGetCompanyList } from '@/api';
import { toast } from '@/hooks/use-toast';
import { uploadToR2, UPLOAD_FOLDERS } from '@/services/r2UploadService';
import { checkServerConnectivity, retryApiCall } from '@/utils/networkUtils';

const AddPost = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedButton, setSelectedButton] = useState<string>('');
  const [postType, setPostType] = useState<string>('image');
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    websiteLink: '',
    brandName: '',
    customButton: '',
    category: '',
    targetAudience: '',
    budget: '',
    duration: '',
    tags: ''
  });

  // Fetch user companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
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

        const companiesResponse = await apiGetCompanyList(userId.toString());
        if (companiesResponse.data && companiesResponse.data.status === 200) {
          const companiesList = companiesResponse.data.data || [];
          setCompanies(companiesList);
          
          if (companiesList.length === 0) {
            toast({
              title: "No Company Found",
              description: "Please create a company profile first.",
              variant: "destructive"
            });
            navigate('/seller/register');
            return;
          }

          // Set selected company from localStorage or first company
          const storedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
          const selectedComp = storedCompany.id ? 
            companiesList.find((c: any) => c.id === storedCompany.id) || companiesList[0] :
            companiesList[0];
          
          setSelectedCompany(selectedComp);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: "Error",
          description: "Failed to fetch company information.",
          variant: "destructive"
        });
      }
    };

    fetchCompanies();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length <= 10) {
      setImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "Please select a company before creating a post.",
        variant: "destructive"
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one image for your post.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get user data for upload
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;

      if (!userId) {
        throw new Error('User information missing. Please log in again.');
      }

      // Upload images to R2 if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const uploadPromises = images.map((file, index) =>
          uploadToR2(file, UPLOAD_FOLDERS.IMAGES, userId, (progress) => {
            console.log(`[Post Image Upload ${index + 1}/${images.length}] ${progress.percentage.toFixed(0)}%`);
          })
        );

        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults
          .filter((result) => result.success && result.url)
          .map((result) => result.url);

        if (images.length > 0 && imageUrls.length === 0) {
          throw new Error('Failed to upload post images.');
        }
      }

      // Sanitize data to prevent undefined values in SQL queries
      const sanitizeValue = (value: any) => {
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') return value.trim();
        return value;
      };
      
      // Format image URLs properly for SQL storage
      const formatImageUrls = (urls: string[]) => {
        if (!urls || urls.length === 0) return '';
        // Filter out any empty strings and join with a single comma (no spaces)
        return urls.filter(url => url && url.trim() !== '').join(',');
      };
      
      const postData = {
        companyId: selectedCompany?.id || null,
        title: sanitizeValue(formData.title),
        description: sanitizeValue(formData.description),
        websiteLink: sanitizeValue(formData.websiteLink),
        brandName: sanitizeValue(formData.brandName || (selectedCompany?.name || '')),
        customButton: sanitizeValue(selectedButton || formData.customButton),
        category: sanitizeValue(formData.category),
        targetAudience: sanitizeValue(formData.targetAudience),
        budget: parseFloat(formData.budget) || 0,
        duration: parseInt(formData.duration) || 7,
        tags: sanitizeValue(formData.tags),
        postType: sanitizeValue(postType),
        // Use the uploaded image URLs with proper formatting
        postImage: imageUrls.length > 0 ? sanitizeValue(imageUrls[0]) : '',
        images: formatImageUrls(imageUrls),
        userId: userId || null,
        createdBy: userId || null
      };

      console.log('Submitting post data:', postData);
      
      // Basic client-side validation
      const errors = [];
      
      // Check required fields (already sanitized)
      if (!postData.title) errors.push('Title is required');
      if (!postData.description) errors.push('Description is required');
      if (!postData.companyId) errors.push('Company selection is required');
      if (postType === 'image' && !postData.postImage) errors.push('Please upload at least one image');
      
      // Check for reasonable length to avoid server validation issues
      if (postData.title && postData.title.length > 200) errors.push('Title is too long (max 200 characters)');
      if (postData.description && postData.description.length > 5000) errors.push('Description is too long (max 5000 characters)');
      
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join('. '),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Use sanitized postData directly for API call
      const enhancedPostData = postData;

      // Check server connectivity before making the API call
      const serverAvailable = await checkServerConnectivity(import.meta.env.VITE_API_URL || 'http://localhost:7082');
      if (!serverAvailable) {
        toast({
          title: "Server Unavailable",
          description: "The server appears to be offline or unreachable. Please check your internet connection and try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

  // Log sanitized data for debugging
  console.log('Sanitized post data to be sent:', JSON.stringify(enhancedPostData, null, 2));
      
  // Use retry functionality for better reliability
  const response = await retryApiCall(() => apiSavePost(enhancedPostData), 1);
      
      console.log('Server response:', response);
      
      if (response.data && response.data.status === 200) {
        toast({
          title: "Success!",
          description: "Post created successfully!",
          variant: "default"
        });
        navigate('/seller/dashboard');
      } else {
        // More detailed error handling
        const errorMessage = response.data?.message || 'Failed to create post';
        console.error('API error response:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // Enhanced error logging for debugging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server Error Response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
        
        // Show more specific error message if available
        toast({
          title: "Server Error",
          description: `Error ${error.response.status}: ${error.response.data?.message || "Server couldn't process the request. Check post data."}`,
          variant: "destructive"
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast({
          title: "Network Error",
          description: "No response from server. Check your internet connection.",
          variant: "destructive"
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        toast({
          title: "Error",
          description: error.message || "Failed to create post. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonOptions = [
    'Shop Now',
    'Learn More',
    'Get Quote',
    'Contact Us',
    'Book Now',
    'Download',
    'Subscribe',
    'Sign Up',
    'Call Now',
    'Visit Website',
    'Apply Now',
    'Join Now'
  ];

  const postTypeOptions = [
    { id: 'image', label: 'Image Post', icon: ImageIcon, description: 'Share photos and graphics' },
    { id: 'video', label: 'Video Post', icon: Video, description: 'Upload video content' },
    { id: 'carousel', label: 'Carousel Post', icon: FileText, description: 'Multiple images in slideshow' },
    { id: 'story', label: 'Story Post', icon: Calendar, description: 'Short-lived content' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] p-6">
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors" 
                onClick={() => navigate('/seller/dashboard')}
                title="Go back to dashboard"
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Post</h1>
                <p className="text-white/80">Design your advertising post with engaging content</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Company Selection */}
            {companies.length > 1 && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Company</label>
                <select 
                  value={selectedCompany?.id || ''}
                  onChange={(e) => {
                    const companyId = parseInt(e.target.value);
                    const company = companies.find(c => c.id === companyId);
                    if (company) {
                      setSelectedCompany(company);
                      localStorage.setItem('selectedCompany', JSON.stringify(company));
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  title="Select Company"
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Post Type Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">Choose Post Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {postTypeOptions.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPostType(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      postType === type.id 
                        ? 'border-[#00dcaa] bg-[#00dcaa]/10' 
                        : 'border-gray-200 hover:border-[#00dcaa]/50'
                    }`}
                  >
                    <type.icon className={`w-6 h-6 mb-2 ${postType === type.id ? 'text-[#00dcaa]' : 'text-gray-500'}`} />
                    <h3 className={`font-semibold ${postType === type.id ? 'text-[#00dcaa]' : 'text-gray-900'}`}>
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Content & Media */}
              <div className="space-y-6">
                
                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {postType === 'video' ? 'Upload Video' : 'Upload Images'}
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`Remove image ${index + 1}`}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#00dcaa] transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Add {postType === 'video' ? 'Video' : 'Image'}</span>
                        <input 
                          type="file" 
                          multiple 
                          accept={postType === 'video' ? 'video/*' : 'image/*'} 
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload up to 10 {postType === 'video' ? 'videos' : 'images'} (Max 10MB each)
                  </p>
                </div>

                {/* Post Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Post Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter an engaging title for your post" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write a compelling description that will attract your audience..." 
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Brand Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name *</label>
                    <input 
                      type="text" 
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleInputChange}
                      placeholder="Your brand name" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website Link</label>
                    <input 
                      type="url" 
                      name="websiteLink"
                      value={formData.websiteLink}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Campaign Settings */}
              <div className="space-y-6">
                
                {/* Call-to-Action Button */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Call-to-Action Button
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {buttonOptions.map((button) => (
                      <button
                        key={button}
                        type="button"
                        onClick={() => setSelectedButton(button)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedButton === button 
                            ? 'border-[#00dcaa] bg-[#00dcaa] text-white' 
                            : 'border-gray-200 text-gray-700 hover:border-[#00dcaa]'
                        }`}
                      >
                        {button}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Button Text</label>
                    <input 
                      type="text" 
                      name="customButton"
                      value={formData.customButton}
                      onChange={handleInputChange}
                      placeholder="Enter custom button text" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Campaign Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <select 
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        required
                        title="Select a category for your post"
                        aria-label="Select a category for your post"
                      >
                        <option value="">Select Category</option>
                        <option value="business">Business & Professional</option>
                        <option value="retail">Retail & E-commerce</option>
                        <option value="food">Food & Restaurants</option>
                        <option value="health">Health & Fitness</option>
                        <option value="education">Education</option>
                        <option value="technology">Technology</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="travel">Travel & Tourism</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                      <input 
                        type="text" 
                        name="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleInputChange}
                        placeholder="e.g., Young professionals, Parents, Students" 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Budget ($)</label>
                        <input 
                          type="number" 
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          placeholder="100" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (days)</label>
                        <input 
                          type="number" 
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          placeholder="7" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                    navigate('/seller/dashboard');
                  }
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save as draft functionality
                  toast({
                    title: "Draft Saved",
                    description: "Your post has been saved as draft. You can continue editing later.",
                    variant: "default"
                  });
                }}
                className="px-6 py-3 border border-[#00dcaa] text-[#00dcaa] rounded-lg hover:bg-[#00dcaa]/10 transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading || !selectedCompany}
                className="px-8 py-3 bg-[#00dcaa] text-white rounded-lg hover:bg-[#00b894] transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{loading ? 'Publishing...' : 'Publish Post'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#00dcaa] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">▶</span>
                </div>
                <span className="text-xl font-bold text-[#00dcaa]">AdTip</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Digital Marketing & Advertising Solutions platform that empowers businesses to grow.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#00dcaa]">About</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Careers</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Advertising</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Small Business</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#00dcaa]">Ad Solutions</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Marketing Solutions</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Sales Solutions</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Help Center</a></li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#00dcaa]">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Privacy & Terms</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Mobile App</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <button className="bg-[#00dcaa] text-white px-4 py-2 rounded text-sm font-medium">
                  QUESTIONS?
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium">
                  SETTINGS
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Get our app now:</p>
                <div className="flex space-x-3">
                  <div className="bg-black text-white px-3 py-1 rounded text-xs">Google Play</div>
                  <div className="bg-black text-white px-3 py-1 rounded text-xs">App Store</div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm" title="Select language">
                  <option>ENGLISH</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                © 2024 AdTip. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AddPost;