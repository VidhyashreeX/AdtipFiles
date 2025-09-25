import React, { useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, Tablet, Tv, Eye, Target, BarChart3, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PreviewAd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedModel, campaignData, uploadedFile, contentData } = location.state || {};

  const [activePreviewDevice, setActivePreviewDevice] = useState('mobile');
  const [conversionGoal, setConversionGoal] = useState('Purchase');
  const [conversionValue, setConversionValue] = useState('');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [facebookPixelId, setFacebookPixelId] = useState('');
  const [utmParameters, setUtmParameters] = useState({
    source: 'adtip',
    medium: selectedModel?.title?.toLowerCase().replace(/\s+/g, '_') || 'ad',
    campaign: campaignData?.campaignName?.toLowerCase().replace(/\s+/g, '_') || 'campaign'
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('utm_')) {
      const utmField = field.replace('utm_', '');
      setUtmParameters(prev => ({
        ...prev,
        [utmField]: value
      }));
    } else {
      switch (field) {
        case 'conversionValue':
          setConversionValue(value);
          break;
        case 'landingPageUrl':
          setLandingPageUrl(value);
          break;
        case 'facebookPixelId':
          setFacebookPixelId(value);
          break;
      }
    }
  };

  const handleAddToCart = () => {
    navigate('/seller/ads-cart', {
      state: {
        adData: {
          selectedModel,
          campaignData,
          uploadedFile,
          contentData,
          conversionGoal,
          conversionValue,
          landingPageUrl,
          facebookPixelId,
          utmParameters
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] p-6">
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors" 
                onClick={() => navigate('/seller/upload-creative')}
                title="Back to Upload Creative"
                aria-label="Back to Upload Creative"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Preview Ad</h1>
                <p className="text-white/80">Step 3 of 5 - Review your ad and set up conversion tracking</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Left Column - Ad Preview */}
              <div className="space-y-6">
                
                {/* Ad Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Ad Preview</h3>
                  
                  {/* Device-Specific Ad Display */}
                  <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all ${
                    activePreviewDevice === 'mobile' ? 'max-w-sm mx-auto' :
                    activePreviewDevice === 'tablet' ? 'max-w-md mx-auto' :
                    activePreviewDevice === 'tv' ? 'w-full' : 'w-full'
                  }`}>
                    <div className="flex items-center justify-between p-2 bg-gray-100 text-xs text-gray-600">
                      <span>Preview: {activePreviewDevice.charAt(0).toUpperCase() + activePreviewDevice.slice(1)}</span>
                      <span>{selectedModel?.title || 'Ad Model'}</span>
                    </div>
                    
                    <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${
                      activePreviewDevice === 'mobile' ? 'h-40' :
                      activePreviewDevice === 'tablet' ? 'h-48' :
                      activePreviewDevice === 'tv' ? 'h-56' : 'h-48'
                    }`}>
                      {uploadedFile ? (
                        <img 
                          src={URL.createObjectURL(uploadedFile)} 
                          alt="Ad preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-white">
                          <Eye className="w-12 h-12 mx-auto mb-2" />
                          <p className={`font-bold ${
                            activePreviewDevice === 'mobile' ? 'text-sm' :
                            activePreviewDevice === 'tv' ? 'text-xl' : 'text-lg'
                          }`}>
                            {contentData?.adTitle || 'Discover the Future of Technology'}
                          </p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Ad by AdTip
                      </div>
                      {selectedModel?.title === 'Skip Video Ad' && (
                        <button className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-xs hover:bg-black/90">
                          Skip Ad
                        </button>
                      )}
                    </div>
                    
                    <div className={`p-4 ${activePreviewDevice === 'mobile' ? 'p-3' : 'p-4'}`}>
                      <h4 className={`font-bold text-gray-900 mb-2 ${
                        activePreviewDevice === 'mobile' ? 'text-sm' :
                        activePreviewDevice === 'tv' ? 'text-lg' : 'text-base'
                      }`}>
                        {contentData?.adTitle || 'Discover the Future of Technology'}
                      </h4>
                      <p className={`text-gray-600 mb-4 ${
                        activePreviewDevice === 'mobile' ? 'text-xs' :
                        activePreviewDevice === 'tv' ? 'text-base' : 'text-sm'
                      }`}>
                        {contentData?.adDescription || 'Experience innovation like never before with our cutting-edge solutions. Join thousands of satisfied customers today!'}
                      </p>
                      <button className={`w-full bg-[#00dcaa] text-white rounded-lg font-semibold hover:bg-[#00b894] transition-colors ${
                        activePreviewDevice === 'mobile' ? 'py-2 text-sm' :
                        activePreviewDevice === 'tv' ? 'py-3 text-lg' : 'py-2'
                      }`}>
                        {contentData?.callToAction || 'Get Started Now'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Platforms */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Platforms</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActivePreviewDevice('desktop')}
                      className={`text-center p-4 rounded-lg border transition-all ${
                        activePreviewDevice === 'desktop' 
                          ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200' 
                          : 'bg-white border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <Monitor className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Web Platforms</span>
                    </button>
                    <button
                      onClick={() => setActivePreviewDevice('mobile')}
                      className={`text-center p-4 rounded-lg border transition-all ${
                        activePreviewDevice === 'mobile' 
                          ? 'bg-green-100 border-green-500 ring-2 ring-green-200' 
                          : 'bg-white border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Mobile Apps</span>
                    </button>
                    <button
                      onClick={() => setActivePreviewDevice('tablet')}
                      className={`text-center p-4 rounded-lg border transition-all ${
                        activePreviewDevice === 'tablet' 
                          ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-200' 
                          : 'bg-white border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <Tablet className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Tablet View</span>
                    </button>
                    <button
                      onClick={() => setActivePreviewDevice('tv')}
                      className={`text-center p-4 rounded-lg border transition-all ${
                        activePreviewDevice === 'tv' 
                          ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-200' 
                          : 'bg-white border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <Tv className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Connected TV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Campaign Details & Tracking */}
              <div className="space-y-6">
                
                {/* Campaign Details */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Campaign Details
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campaign Name:</span>
                      <span className="font-medium text-gray-900">{campaignData?.campaignName || 'Tech Innovation Campaign'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ad Type:</span>
                      <span className="font-medium text-gray-900">{selectedModel?.title || 'Skip Video Ad'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium text-gray-900">₹30,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Age:</span>
                      <span className="font-medium text-gray-900">18-45 years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Devices:</span>
                      <span className="font-medium text-gray-900">Mobile, Desktop, Tablet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Region:</span>
                      <span className="font-medium text-gray-900">Global</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campaign Duration:</span>
                      <span className="font-medium text-gray-900">{campaignData?.campaignDurationDays || '30'} days</span>
                    </div>
                  </div>
                </div>

                {/* Conversion Tracking */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    Conversion Tracking
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Conversion Goal */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Conversion Goal</label>
                        <select 
                          value={conversionGoal}
                          onChange={(e) => setConversionGoal(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                          title="Select conversion goal"
                          aria-label="Select conversion goal"
                        >
                          <option value="Purchase">Purchase</option>
                          <option value="Sign Up">Sign Up</option>
                          <option value="Lead Generation">Lead Generation</option>
                          <option value="Page View">Page View</option>
                          <option value="Click">Click</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Average value of each conversion</label>
                        <input 
                          type="number"
                          value={conversionValue}
                          onChange={(e) => handleInputChange('conversionValue', e.target.value)}
                          placeholder="0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Landing Page URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Landing Page URL</label>
                      <input 
                        type="url"
                        value={landingPageUrl}
                        onChange={(e) => handleInputChange('landingPageUrl', e.target.value)}
                        placeholder="https://yourwebsite.com/landing-page"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      />
                    </div>

                    {/* Conversion Value & Facebook Pixel */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook Pixel ID (Optional)</label>
                      <input 
                        type="text"
                        value={facebookPixelId}
                        onChange={(e) => handleInputChange('facebookPixelId', e.target.value)}
                        placeholder="Your Facebook Pixel ID"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">For enhanced tracking and retargeting</p>
                    </div>
                  </div>
                </div>

                {/* UTM Parameters */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2 text-[#00dcaa]" />
                    UTM Parameters (Auto-generated)
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">utm_source</label>
                        <input 
                          type="text"
                          value={utmParameters.source}
                          readOnly
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">utm_medium</label>
                        <input 
                          type="text"
                          value={utmParameters.medium}
                          readOnly
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">utm_campaign</label>
                        <input 
                          type="text"
                          value={utmParameters.campaign}
                          readOnly
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 text-gray-700"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">UTM parameters help track campaign performance in Google Analytics</p>
                  </div>
                </div>

                {/* Estimated Performance */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Performance</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-cyan-200">
                      <div className="text-lg font-bold text-[#00dcaa]">₹2.50</div>
                      <p className="text-xs text-gray-600">Expected cost per click</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-cyan-200">
                      <div className="text-lg font-bold text-[#00dcaa]">3.2%</div>
                      <p className="text-xs text-gray-600">Expected CTR</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-cyan-200">
                      <div className="text-lg font-bold text-[#00dcaa]">45K</div>
                      <p className="text-xs text-gray-600">Estimated reach</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-cyan-200">
                      <div className="text-lg font-bold text-[#00dcaa]">2.1%</div>
                      <p className="text-xs text-gray-600">Expected conversion rate</p>
                    </div>
                  </div>
                </div>

                {/* Conversion Tracking Ready */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-900">Conversion Tracking Ready</h4>
                      <p className="text-sm text-emerald-700">
                        Your conversion tracking is configured and ready to measure campaign performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row gap-4 justify-between">
              <button
                type="button"
                onClick={() => navigate('/seller/upload-creative')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back
              </button>
              
              <button
                type="button"
                onClick={handleAddToCart}
                className="px-8 py-3 bg-[#00dcaa] text-white rounded-lg hover:bg-[#00b894] transition-colors font-semibold"
              >
                Add to Ad Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 w-full">
        <div className="max-w-full mx-auto px-6">
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

export default PreviewAd;