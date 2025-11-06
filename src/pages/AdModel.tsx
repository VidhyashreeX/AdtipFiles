import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdModel: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectModel = (model: any) => {
    // All models now follow the same campaign workflow
    navigate('/seller/configure-campaign', { state: { selectedModel: model } });
  };

  const adModels = [
    {
      id: 1,
      title: 'Skip Ads',
      price: '₹0.20',
      description: 'Engaging video ads that users can skip after 5 seconds. Payout: ₹0.20 per view',
      image: '/api/placeholder/300/150',
      recommended: true
    },
    {
      id: 2,
      title: 'Non-Skip Ads',
      price: '₹0.40',
      description: 'Compelling 20-second videos that guarantee full view. Payout: ₹0.40 per view',
      image: '/api/placeholder/300/150',
      recommended: false
    },
    {
      id: 3,
      title: 'Bumper Ads',
      price: '₹0.25',
      description: 'Short 8-second video ads for maximum impact. Payout: ₹0.25 per view',
      image: '/api/placeholder/300/150',
      recommended: false
    },
    {
      id: 4,
      title: 'Brand Awareness Ads',
      price: '₹0.20',
      description: '8-second ads focused on brand recognition. Payout: ₹0.20 per view',
      image: '/api/placeholder/300/150',
      recommended: false
    },
    {
      id: 5,
      title: 'Business Status Ads',
      price: '₹0.20',
      description: 'Image or video ads for business promotion. Payout: ₹0.20 per view',
      image: '/api/placeholder/300/150',
      recommended: false
    },
    {
      id: 6,
      title: 'Non-Skip + Lead Ads',
      price: '₹1.00',
      description: 'Non-skippable ads with lead generation. Payout: ₹1.00 per engagement',
      image: '/api/placeholder/300/150',
      recommended: true
    },
    {
      id: 7,
      title: 'Brand Awareness + Question Ads',
      price: '₹1.00',
      description: '8-second ads with interactive questions. Payout: ₹1.00 per engagement',
      image: '/api/placeholder/300/150',
      recommended: false
    },
    {
      id: 8,
      title: 'Non-Skip + Question Ads',
      price: '₹1.00',
      description: '20-second ads with interactive questions. Payout: ₹1.00 per engagement',
      image: '/api/placeholder/300/150',
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Select Ad Model</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Choose the perfect ad format for your campaign with transparent pricing</p>
        </div>

        {/* Ad Model Cards - First Row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {adModels.slice(0, 4).map((model) => (
            <div key={model.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 relative max-w-sm mx-auto transform hover:scale-105">
              {model.recommended && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-3 py-1 rounded-full text-sm font-medium z-10 shadow-md">
                  Recommended
                </div>
              )}
              
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                <div className="absolute top-4 left-4 bg-gray-900/80 dark:bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {model.price}
                </div>
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black flex items-center justify-center">
                  <span className="text-white text-lg font-bold">{model.title}</span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{model.title}</h3>
                <div className="text-2xl font-bold text-[#00dcaa] mb-4">{model.price}</div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{model.description}</p>
                
                <button 
                  className="w-full bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={() => handleSelectModel(model)}
                >
                  Select This Model
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ad Model Cards - Second Row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center max-w-7xl mx-auto">
          {adModels.slice(4).map((model) => (
            <div key={model.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 relative max-w-sm mx-auto transform hover:scale-105">
              {model.recommended && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-3 py-1 rounded-full text-sm font-medium z-10 shadow-md">
                  Recommended
                </div>
              )}
              
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                <div className="absolute top-4 left-4 bg-gray-900/80 dark:bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {model.price}
                </div>
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black flex items-center justify-center">
                  <span className="text-white text-lg font-bold">{model.title}</span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{model.title}</h3>
                <div className="text-2xl font-bold text-[#00dcaa] mb-4">{model.price}</div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{model.description}</p>
                
                <button 
                  className="w-full bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={() => handleSelectModel(model)}
                >
                  Select This Model
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 mb-16">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need Help Choosing?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Our experts can help you select the perfect ad model for your business needs.</p>
            <button className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
              Contact Our Experts
            </button>
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

export default AdModel;