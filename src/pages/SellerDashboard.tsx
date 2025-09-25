import React, { useState, useEffect } from 'react';
import { MapPin, Users, Star, Globe, Phone, Mail, Package, FileText, TrendingUp, MessageSquare, Heart, Eye, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({
    companyName: 'TechVolt Inc.',
    email: 'contact@techvolt.com',
    phone: '+1 (555) 123-4567',
    website: 'www.techvolt.com',
    address: 'San Francisco, CA',
    description: 'Leading technology solutions provider specializing in innovative hardware and software products for businesses and consumers worldwide.',
    logo: null as File | string | null,
    banner: null as File | string | null
  });

  // Update seller info when coming from registration or edit
  useEffect(() => {
    if (location.state?.updatedData) {
      setSellerInfo(prevInfo => ({
        ...prevInfo,
        ...location.state.updatedData,
        address: location.state.updatedData.location || prevInfo.address
      }));
    }
  }, [location.state]);

  const products = [
    {
      id: 1,
      name: 'New MacBook pro',
      description: 'A MacBook is a laptop computer designed by Apple.',
      image: null,
      price: 999,
      originalPrice: 1299,
      discount: '23% OFF'
    },
    {
      id: 2,
      name: 'Samsung S23',
      description: 'A Samsung Galaxy smartphone with advanced features.',
      image: null,
      price: 899,
      originalPrice: 1099,
      discount: '18% OFF'
    }
  ];

  const posts = [
    {
      id: 1,
      title: 'Apple MacBook Pro M2',
      description: 'The new MacBook Pro is a beast. Supercharged for pros by the M1 Pro or M1 Max, this... thing delivers performance that pushes limits!',
      image: null,
      likes: 45,
      brand: 'Apple'
    },
    {
      id: 2,
      title: 'Beats by Dre',
      description: 'THE GAME STARTS HERE! Premium wireless headphones with superior sound quality.',
      image: null,
      likes: 32,
      brand: 'Beats'
    }
  ];
  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Company Profile Header */}
      <div className="relative">
        {/* Banner Background */}
        <div className="h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          {sellerInfo.banner ? (
            <img 
              src={typeof sellerInfo.banner === 'string' ? sellerInfo.banner : URL.createObjectURL(sellerInfo.banner)}
              alt="Company Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8 -mt-16 pb-8">
            {/* Company Information */}
            <div className="text-center md:text-left flex-1">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                {/* Company Header with Logo beside title */}
                <div className="flex items-center space-x-4 mb-4">
                  {/* Company Logo */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                      {sellerInfo.logo ? (
                        <img 
                          src={typeof sellerInfo.logo === 'string' ? sellerInfo.logo : URL.createObjectURL(sellerInfo.logo)}
                          alt="Company Logo"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-[#00dcaa] to-[#00b894] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">
                            {sellerInfo.companyName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Title and Number */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{sellerInfo.companyName}</h1>
                    <div className="flex items-center space-x-2">
                      <span className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-3 py-1 rounded-full text-sm font-semibold">
                        #1 Seller
                      </span>
                      <span className="text-gray-500 text-sm">Verified Business</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 max-w-2xl">{sellerInfo.description}</p>
                
                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#00dcaa]" />
                    <span>{sellerInfo.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#00dcaa]" />
                    <span>{sellerInfo.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-[#00dcaa]" />
                    <span>{sellerInfo.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-[#00dcaa]" />
                    <span>{sellerInfo.website}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center md:justify-start space-x-4">
                  <button 
                    onClick={() => navigate('/seller/edit-info', { state: { sellerData: sellerInfo } })}
                    className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-[#00b894] hover:to-[#00a085] transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Edit Info
                  </button>
                  <button 
                    onClick={() => navigate('/seller/ad-orders')}
                    className="bg-white border-2 border-[#00dcaa] text-[#00dcaa] hover:bg-[#00dcaa] hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top Products */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Top products</h2>
                <button 
                  className="bg-[#00dcaa] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                  onClick={() => navigate('/seller/add-product')}
                >
                  Add Product
                </button>
              </div>
              <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-lg p-4 min-w-[240px] max-w-[240px] flex-shrink-0 border border-gray-100">
                    <div className="w-full h-28 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-bold text-[#00dcaa]">${product.price}</span>
                      <span className="text-xs text-gray-400 line-through">${product.originalPrice}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">{product.discount}</span>
                    </div>
                    <div className="space-y-2">
                      <button 
                        className="w-full bg-[#00dcaa] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                        onClick={() => navigate('/seller/ad-model')}
                      >
                        Promote ⭐
                      </button>
                      <div className="flex space-x-1.5">
                        <button className="flex-1 border border-[#00dcaa] text-[#00dcaa] py-1.5 px-2 rounded text-xs font-medium hover:bg-[#00dcaa] hover:text-white transition-colors">
                          View
                        </button>
                        <button className="flex-1 border border-[#00dcaa] text-[#00dcaa] py-1.5 px-2 rounded text-xs font-medium hover:bg-[#00dcaa] hover:text-white transition-colors">
                          Likes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <button 
                  className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#00b894] hover:to-[#00a085] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => navigate('/seller/products')}
                >
                  See All Products
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
                <button 
                  className="bg-[#00dcaa] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                  onClick={() => navigate('/seller/add-post')}
                >
                  Add Post
                </button>
              </div>
              <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-lg p-4 min-w-[240px] max-w-[240px] flex-shrink-0 border border-gray-100">
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{post.brand[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate block">{post.brand}</span>
                      </div>
                    </div>
                    <div className="w-full h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Post Content</span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2 truncate">{post.title}</h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-1 text-[#00dcaa] text-xs">
                          <MessageSquare className="w-3 h-3" />
                          <span>CHAT</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-600 text-xs">
                          <MessageSquare className="w-3 h-3" />
                          <span>COMMENT</span>
                        </button>
                        <button className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{post.likes}</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button 
                        className="w-full bg-[#00dcaa] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                        onClick={() => navigate('/seller/ad-model')}
                      >
                        Promote ⭐
                      </button>
                      <button className="w-full border border-[#00dcaa] text-[#00dcaa] py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-[#00dcaa] hover:text-white transition-colors">
                        Like
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <button 
                  className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#00b894] hover:to-[#00a085] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => navigate('/seller/posts')}
                >
                  See All Posts
                </button>
              </div>
            </div>

            {/* Recent Ads */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Ads</h2>
                <button 
                  className="bg-[#00dcaa] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                  onClick={() => navigate('/seller/ad-model')}
                >
                  Book Ad
                </button>
              </div>
              <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { brand: 'Apple', title: 'MacBook Pro M2', description: 'The new MacBook Pro is a beast. Supercharged for pros by the M1 Pro or M1 Max, this... thing delivers performance that pushes limits!' },
                  { brand: 'Beats by Dre', title: 'Beats Bass Pro', description: 'THE GAME STARTS HERE! Premium wireless headphones with superior sound quality and noise cancellation technology.' }
                ].map((ad, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-4 min-w-[240px] max-w-[240px] flex-shrink-0 border border-gray-100">
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{ad.brand[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate block">{ad.brand}</span>
                      </div>
                    </div>
                    <div className="w-full h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Ad Preview</span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2 truncate">{ad.title}</h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 text-[#00dcaa] text-xs">
                          <MessageSquare className="w-3 h-3" />
                          <span>CHAT</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-600 text-xs">
                          <MessageSquare className="w-3 h-3" />
                          <span>COMMENT</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="flex items-center space-x-1" title="Like ad">
                          <Heart className="w-3 h-3 text-gray-400" />
                        </button>
                        <button className="flex items-center space-x-1" title="View ad">
                          <Eye className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About AdTip</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                AdTip is a leading digital marketing platform that empowers businesses to create, 
                manage, and optimize their advertising campaigns across multiple channels. We provide 
                innovative solutions for content creators, businesses, and marketers to maximize their 
                reach and engagement.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">www.adtip.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">contact@adtip.com</span>
                </div>
              </div>
            </div>

            {/* Company Location */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Company Location</h2>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Map View</p>
                  <p className="text-xs text-gray-500">San Francisco, CA</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#00dcaa]" />
                <span className="text-sm font-medium text-gray-900">123 Market Street, San Francisco, CA 94103</span>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">They are saying...</h2>
              <div className="space-y-4">
                {[
                  { name: 'Sarah Johnson', rating: 5, comment: 'Excellent service and great results!' },
                  { name: 'Mike Chen', rating: 5, comment: 'Very professional and effective campaigns.' },
                  { name: 'Lisa Davis', rating: 4, comment: 'Good experience overall, would recommend.' }
                ].map((review, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">{review.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.name}</p>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <button 
                  className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#00b894] hover:to-[#00a085] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => navigate('/seller/reviews')}
                >
                  View All Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-[#00dcaa] to-[#00b894] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">▶</span>
                </div>
                <span className="text-2xl font-bold text-[#00dcaa]">AdTip</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Empowering sellers to grow their business with innovative advertising solutions.
              </p>
              <div className="flex space-x-3">
                <button className="w-8 h-8 bg-[#00dcaa] text-white rounded-full flex items-center justify-center hover:bg-[#00b894] transition-colors">
                  <span className="text-xs">f</span>
                </button>
                <button className="w-8 h-8 bg-[#00dcaa] text-white rounded-full flex items-center justify-center hover:bg-[#00b894] transition-colors">
                  <span className="text-xs">t</span>
                </button>
                <button className="w-8 h-8 bg-[#00dcaa] text-white rounded-full flex items-center justify-center hover:bg-[#00b894] transition-colors">
                  <span className="text-xs">in</span>
                </button>
              </div>
            </div>

            {/* Seller Tools */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Seller Tools</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/seller/dashboard')}
                  className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/seller/products')}
                  className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm"
                >
                  My Products
                </button>
                <button 
                  onClick={() => navigate('/seller/ad-orders')}
                  className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm"
                >
                  Ad Orders
                </button>
                <button 
                  onClick={() => navigate('/seller/analytics')}
                  className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm"
                >
                  Analytics
                </button>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <div className="space-y-2">
                <a href="/help" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Help Center</a>
                <a href="/contact" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Contact Us</a>
                <a href="/community" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Community</a>
                <a href="/tutorials" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Tutorials</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <div className="space-y-2">
                <a href="/terms" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Terms of Service</a>
                <a href="/privacy" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Privacy Policy</a>
                <a href="/cookies" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Cookie Policy</a>
                <a href="/guidelines" className="block text-gray-600 hover:text-[#00dcaa] transition-colors text-sm">Guidelines</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-300 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-500 mb-4 md:mb-0">
                © {new Date().getFullYear()} AdTip. All rights reserved. Made with ❤️ for sellers worldwide.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>🌍 English</span>
                <span>💵 USD</span>
                <span>📍 Global</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* Edit Info Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Seller Information</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowEditModal(false);
              // Here you would typically save to backend
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={sellerInfo.companyName}
                    onChange={(e) => setSellerInfo({...sellerInfo, companyName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={sellerInfo.email}
                    onChange={(e) => setSellerInfo({...sellerInfo, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={sellerInfo.phone}
                    onChange={(e) => setSellerInfo({...sellerInfo, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={sellerInfo.website}
                    onChange={(e) => setSellerInfo({...sellerInfo, website: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={sellerInfo.address}
                    onChange={(e) => setSellerInfo({...sellerInfo, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={sellerInfo.description}
                    onChange={(e) => setSellerInfo({...sellerInfo, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00dcaa] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#00b894] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;