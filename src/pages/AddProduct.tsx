import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Plus, X, Package, Truck, DollarSign, Tag, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiAddProduct, apiGetCompanyList } from '@/api';
import { toast } from '@/hooks/use-toast';
import { uploadToR2, UPLOAD_FOLDERS, UploadResult } from '@/services/r2UploadService';
import { validateProductData, getSelectedCompanyId } from '@/utils/apiValidation';
import { checkServerConnectivity, retryApiCall } from '@/utils/networkUtils';
import { useAuthModal } from '../contexts/AuthModalContext';

type Company = {
  id: number;
  name: string;
  [key: string]: unknown;
};

type ProductFormData = {
  name: string;
  description: string;
  brandName: string;
  category: string;
  deliveryTime: string;
  unitsAvailable: string;
  sizeOptions: string[];
  regularPrice: string;
  marketPrice: string;
  deliveryType: string;
  weight: string;
  dimensions: string;
};

const CATEGORY_MAP: Record<string, number> = {
  electronics: 1,
  clothing: 2,
  home: 3,
  books: 4,
  sports: 5,
  beauty: 6,
  toys: 7,
  automotive: 8,
};

const AddProduct = () => {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    brandName: '',
    category: '',
    deliveryTime: '',
    unitsAvailable: '',
    sizeOptions: [],
    regularPrice: '',
    marketPrice: '',
    deliveryType: '',
    weight: '',
    dimensions: ''
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [sizeInput, setSizeInput] = useState('');

  // Fetch user companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const userDataRaw = localStorage.getItem('user');
        const parsedUser = userDataRaw ? (JSON.parse(userDataRaw) as Record<string, unknown>) : {};
        const userIdValue = parsedUser?.id;
        const userId = typeof userIdValue === 'string' ? Number.parseInt(userIdValue, 10) : userIdValue;

        if (typeof userId !== 'number' || Number.isNaN(userId)) {
          toast({
            title: "Error",
            description: "User not found. Please log in again.",
            variant: "destructive"
          });
          openLoginModal();
          return;
        }

        const companiesResponse = await apiGetCompanyList(userId.toString());
        if (companiesResponse.data && companiesResponse.data.status === 200) {
          const rawCompanies = (companiesResponse.data.data ?? []) as unknown[];
          const normalizedCompanies = rawCompanies
            .map((company): Company | null => {
              if (!company || typeof company !== 'object') {
                return null;
              }
              const companyRecord = company as Record<string, unknown>;
              const rawId = companyRecord.id;
              const rawName = companyRecord.name;

              if ((typeof rawId !== 'number' && typeof rawId !== 'string') || typeof rawName !== 'string') {
                return null;
              }

              const numericId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId;
              if (!Number.isFinite(numericId)) {
                return null;
              }

              return {
                ...companyRecord,
                id: numericId,
                name: rawName,
              } as Company;
            })
            .filter((company): company is Company => Boolean(company));

          setCompanies(normalizedCompanies);
          
          if (normalizedCompanies.length === 0) {
            toast({
              title: "No Company Found",
              description: "Please create a company profile first.",
              variant: "destructive"
            });
            navigate('/seller/register');
            return;
          }

          // Set selected company from localStorage or first company
          const storedCompanyRaw = localStorage.getItem('selectedCompany');
          let storedCompany: Partial<Company> = {};
          if (storedCompanyRaw) {
            try {
              storedCompany = JSON.parse(storedCompanyRaw) as Partial<Company>;
            } catch (parseError) {
              console.error('Error parsing stored company:', parseError);
            }
          }

          const targetCompany = storedCompany?.id
            ? normalizedCompanies.find((company) => company.id === storedCompany?.id)
            : undefined;
          const selectedComp = targetCompany ?? normalizedCompanies[0];
          
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

    // Load any existing draft
    const loadDraft = () => {
      try {
        const draftData = localStorage.getItem('productDraft');
        if (draftData) {
          const draft = JSON.parse(draftData);
          setFormData({
            name: draft.name || '',
            description: draft.description || '',
            brandName: draft.brandName || '',
            category: draft.category || '',
            deliveryTime: draft.deliveryTime || '',
            unitsAvailable: draft.unitsAvailable || '',
            sizeOptions: draft.sizeOptions || [],
            regularPrice: draft.regularPrice || '',
            marketPrice: draft.marketPrice || '',
            deliveryType: draft.deliveryType || '',
            weight: draft.weight || '',
            dimensions: draft.dimensions || ''
          });
          // Note: We don't restore images from draft since File objects can't be serialized
          // User will need to re-upload images
          
          toast({
            title: "Draft Loaded",
            description: "Your saved draft has been loaded.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    fetchCompanies();
    loadDraft();
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
    if (images.length + files.length <= 6) {
      setImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizeOptions.includes(sizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizeOptions: [...prev.sizeOptions, sizeInput.trim()]
      }));
      setSizeInput('');
    }
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizeOptions: prev.sizeOptions.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDraft = async () => {
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "Please select or create a company first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save draft data to localStorage (excluding images since File objects can't be serialized)
      const draftData = {
        ...formData,
        companyId: selectedCompany.id,
        imageCount: images.length, // Save count for reference
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('productDraft', JSON.stringify(draftData));
      
      toast({
        title: "Draft Saved",
        description: "Your product draft has been saved successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "Please select or create a company first.",
        variant: "destructive"
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product image.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get user data for the API call
      const userDataRaw = localStorage.getItem('user');
      const parsedUser = userDataRaw ? (JSON.parse(userDataRaw) as Record<string, unknown>) : {};
      const rawUserId = parsedUser?.id;
      const userId = typeof rawUserId === 'string' ? Number.parseInt(rawUserId, 10) : rawUserId;

      if (typeof userId !== 'number' || Number.isNaN(userId)) {
        throw new Error('User information missing. Please log in again.');
      }

      // Upload product images to R2 and collect URLs
      const uploadPromises = images.map((file, index) =>
        uploadToR2(file, UPLOAD_FOLDERS.IMAGES, userId, (progress) => {
            console.log(
              `[Product Upload ${index + 1}/${images.length}] ${progress.percentage.toFixed(0)}%`
            );
        })
      );

      const uploadResults: UploadResult[] = await Promise.all(uploadPromises);

      const imageUrls = uploadResults
        .filter((result) => result.success && result.url)
        .map((result) => result.url);

      if (imageUrls.length === 0) {
        throw new Error('Failed to upload product images.');
      }
      
      // Create product data matching the backend SQL structure exactly
      const productData = {
        // Core product fields matching backend SQL - using exact field names as backend expects
        name: formData.name || '',
        description: formData.description || '',
        brand: formData.brandName || selectedCompany.name || '',
        categoryId: CATEGORY_MAP[formData.category] || parseInt(formData.category) || 1,
        deliveryTime: formData.deliveryTime || '1-2 days', // Backend uses deliveryTime in VALUES
        units: parseInt(formData.unitsAvailable) || 1,
        regularPrice: parseFloat(formData.regularPrice) || 0, // Backend uses regularPrice in VALUES
        marketPrice: parseFloat(formData.marketPrice) || 0, // Backend uses marketPrice in VALUES
        size: formData.sizeOptions.length > 0 ? formData.sizeOptions.join(',') : '',
        images: imageUrls.join(','),
        companyId: selectedCompany.id, // Backend uses companyId in VALUES
        deliveryType: formData.deliveryType || 'Standard', // Backend uses deliveryType in VALUES
        termsApply: 'Standard terms and conditions apply', // Backend uses termsApply in VALUES
        created_by: userId,
        your_price: parseFloat(formData.regularPrice) || 0,
        keyword: formData.name ? formData.name.toLowerCase().replace(/\s+/g, ',') : '',
        manufacturer_date: new Date().toISOString().split('T')[0],
        product_description: formData.description || '',
        product_specification: `Weight: ${formData.weight || 0}kg, Dimensions: ${formData.dimensions || 'N/A'}`,
        inches: 0,
        additional_accessories: '',
        stock: parseInt(formData.unitsAvailable) || 1,
        procurement_type: 'Direct',
        procurement_time: 1,
        shipping_fee: 0,
        replacement_days: 7,
        warranty_days: 30,
        sku_id: `SKU-${Date.now()}`,
        auto_bargain: 0,
        bargain_minimum_price: parseFloat(formData.regularPrice) * 0.9 || 0,
        primary_image: imageUrls[0],
      };

  console.log('Submitting product data:', productData);

  // Additional validation specifically to match backend expectations
  const serverValidationErrors = [];
  
  // Check for critical fields that might cause SQL errors
  if (!productData.name) serverValidationErrors.push('Product name is required');
  if (!productData.description) serverValidationErrors.push('Product description is required');
  if (!productData.companyId) serverValidationErrors.push('Company ID is missing');
  if (!productData.regularPrice) serverValidationErrors.push('Product price must be greater than 0');
  if (images.length === 0 || !productData.primary_image) serverValidationErrors.push('At least one product image is required');
  
  // Check if we've mixed up field names (common source of 500 errors)
  const expectedServerFields = ['companyId', 'name', 'description', 'regularPrice', 'categoryId', 'units', 'images', 'primary_image'];
  const missingFields = expectedServerFields.filter(field => {
    return productData[field] === undefined || productData[field] === null || productData[field] === '';
    return productData[field] === undefined || productData[field] === null;
  });
  
  if (missingFields.length > 0) {
    serverValidationErrors.push(`Missing expected fields: ${missingFields.join(', ')}`);
  }
  
  if (serverValidationErrors.length > 0) {
    toast({
      title: "Server Compatibility Error",
      description: serverValidationErrors.join('. '),
      variant: "destructive"
    });
    setLoading(false);
    return;
  }
  
  // Create a copy with debug information to help diagnose server errors
  // Sanitize the product data to ensure no undefined values
  const sanitizedProductData = Object.fromEntries(
    Object.entries(productData).map(([key, value]) => {
      // Replace undefined or null values with appropriate defaults based on field type
      if (value === undefined || value === null) {
        // Provide appropriate defaults based on field name/type
        if (key.includes('price') || key.includes('fee')) return [key, 0];
        if (key.includes('days') || key.includes('units') || key.includes('stock')) return [key, 0];
        if (key.includes('image') && key !== 'images' && key !== 'primary_image') return [key, '']; 
        return [key, ''];  // Default to empty string for other fields
      }
      // Ensure any array values are properly converted to strings
      if (Array.isArray(value)) {
        return [key, value.join(',')];
      }
      return [key, value];
    })
  );
  
  // Remove debug info to prevent SQL issues
  const enhancedProductData = {
    ...sanitizedProductData
  };

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

  // Use retry functionality for better reliability
  const response = await retryApiCall(() => apiAddProduct(enhancedProductData), 1);
      
      if (response.data && response.data.status === 200) {
        // Clear draft on successful submission
        localStorage.removeItem('productDraft');
        setImages([]);
        setFormData({
          name: '',
          description: '',
          brandName: '',
          category: '',
          deliveryTime: '',
          unitsAvailable: '',
          sizeOptions: [],
          regularPrice: '',
          marketPrice: '',
          deliveryType: '',
          weight: '',
          dimensions: ''
        });
        
        toast({
          title: "Success!",
          description: "Product added successfully!",
          variant: "default"
        });
        navigate('/seller/dashboard');
      } else {
        throw new Error(response.data?.message || 'Failed to add product');
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      
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
          description: `Error ${error.response.status}: ${error.response.data?.message || "Server couldn't process the request. Check product data."}`,
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
          description: error.message || "Failed to add product. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] p-6">
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors" 
                onClick={() => navigate('/seller/dashboard')}
                type="button"
                aria-label="Go back to seller dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Add New Product</h1>
                <p className="text-white/80">Fill in the details to list your product</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Company Selection */}
            {companies.length > 1 && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <label htmlFor="company-select" className="block text-sm font-semibold text-gray-700 mb-2">Select Company</label>
                <select 
                  id="company-select"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                
                {/* Product Images */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Product Images</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image instanceof File ? URL.createObjectURL(image) : ''} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 6 && (
                      <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#00dcaa] transition-colors">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Add Image</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Upload up to 6 images (Max 2MB each)</p>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name" 
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
                    placeholder="Describe your product features, benefits, and specifications" 
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Brand and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name *</label>
                    <input 
                      type="text" 
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleInputChange}
                      placeholder="Brand name" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="product-category" className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <select 
                        id="product-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent" 
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="electronics">Electronics</option>
                      <option value="clothing">Clothing & Fashion</option>
                      <option value="home">Home & Living</option>
                      <option value="books">Books & Media</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="beauty">Beauty & Personal Care</option>
                      <option value="toys">Toys & Games</option>
                      <option value="automotive">Automotive</option>
                    </select>
                  </div>
                </div>

                {/* Size Options */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size Options</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.sizeOptions.map((size, index) => (
                      <span key={index} className="bg-[#00dcaa] text-white px-3 py-1 rounded-full text-sm flex items-center">
                        {size}
                        <button
                          type="button"
                          onClick={() => removeSize(index)}
                          className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                          aria-label={`Remove size ${size}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="Enter size (e.g., S, M, L, XL)" 
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    />
                    <button
                      type="button"
                      onClick={addSize}
                      className="bg-[#00dcaa] text-white px-4 py-2 rounded-lg hover:bg-[#00b894] transition-colors flex items-center gap-2"
                      aria-label="Add size option"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm font-medium">Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Pricing & Shipping */}
              <div className="space-y-6">
                
                {/* Pricing */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Pricing Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Regular Price *</label>
                      <input 
                        type="number" 
                        name="regularPrice"
                        value={formData.regularPrice}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Market Price</label>
                      <input 
                        type="number" 
                        name="marketPrice"
                        value={formData.marketPrice}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Units Available *</label>
                    <input 
                      type="number" 
                      name="unitsAvailable"
                      value={formData.unitsAvailable}
                      onChange={handleInputChange}
                      placeholder="Enter stock quantity" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Shipping & Delivery */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Shipping & Delivery
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="delivery-type" className="block text-sm font-semibold text-gray-700 mb-2">Delivery Type *</label>
                      <select 
                        id="delivery-type"
                        name="deliveryType"
                        value={formData.deliveryType}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent" 
                        required
                      >
                        <option value="">Select Delivery Type</option>
                        <option value="standard">Standard Delivery</option>
                        <option value="express">Express Delivery</option>
                        <option value="overnight">Overnight Delivery</option>
                        <option value="pickup">Store Pickup</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="delivery-time" className="block text-sm font-semibold text-gray-700 mb-2">Delivery Time *</label>
                      <select 
                        id="delivery-time"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent" 
                        required
                      >
                        <option value="">Select Delivery Time</option>
                        <option value="1-2 days">1-2 Business Days</option>
                        <option value="3-5 days">3-5 Business Days</option>
                        <option value="1 week">1 Week</option>
                        <option value="2 weeks">2 Weeks</option>
                        <option value="custom">Custom Timeline</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                        <input 
                          type="number" 
                          name="weight"
                          value={formData.weight}
                          onChange={handleInputChange}
                          placeholder="Product weight" 
                          step="0.1"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensions</label>
                        <input 
                          type="text" 
                          name="dimensions"
                          value={formData.dimensions}
                          onChange={handleInputChange}
                          placeholder="L x W x H (cm)" 
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
                onClick={() => navigate('/seller/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading || !selectedCompany}
                className="px-6 py-3 border border-[#00dcaa] text-[#00dcaa] rounded-lg hover:bg-[#00dcaa]/10 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                <span>{loading ? 'Publishing...' : 'Publish Product'}</span>
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

export default AddProduct;