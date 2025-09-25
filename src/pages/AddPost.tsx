import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Image as ImageIcon, Video, FileText, Calendar, Target, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddPost = () => {
  const navigate = useNavigate();
  const [selectedButton, setSelectedButton] = useState<string>('');
  const [postType, setPostType] = useState<string>('image');
  const [images, setImages] = useState([]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Post data:', { ...formData, selectedButton, postType, images });
    navigate('/seller/dashboard');
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

                {/* Additional Settings */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Additional Settings
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tags & Keywords</label>
                    <input 
                      type="text" 
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Enter relevant tags separated by commas" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">e.g., promotion, sale, new product, trending</p>
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
                className="px-6 py-3 border border-[#00dcaa] text-[#00dcaa] rounded-lg hover:bg-[#00dcaa]/10 transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-[#00dcaa] text-white rounded-lg hover:bg-[#00b894] transition-colors font-semibold"
              >
                Publish Post
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