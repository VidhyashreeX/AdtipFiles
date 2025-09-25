import React from 'react';
import { ArrowLeft, Package, Star, Eye, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ViewAllProducts = () => {
  const navigate = useNavigate();
  
  const products = [
    {
      id: 1,
      name: 'Smart Marketing Campaign',
      price: 99,
      originalPrice: 129,
      rating: 4.8,
      reviews: 234,
      views: 1250,
      category: 'Marketing',
      image: null,
      inStock: true
    },
    {
      id: 2,
      name: 'Content Creator Suite',
      price: 149,
      originalPrice: 199,
      rating: 4.9,
      reviews: 189,
      views: 890,
      category: 'Content',
      image: null,
      inStock: true
    },
    {
      id: 3,
      name: 'Analytics Dashboard Pro',
      price: 79,
      originalPrice: 99,
      rating: 4.7,
      reviews: 156,
      views: 670,
      category: 'Analytics',
      image: null,
      inStock: false
    },
    {
      id: 4,
      name: 'Social Media Booster',
      price: 59,
      originalPrice: 79,
      rating: 4.6,
      reviews: 298,
      views: 1890,
      category: 'Social Media',
      image: null,
      inStock: true
    },
    {
      id: 5,
      name: 'Email Marketing Tool',
      price: 89,
      originalPrice: 119,
      rating: 4.8,
      reviews: 167,
      views: 543,
      category: 'Email',
      image: null,
      inStock: true
    },
    {
      id: 6,
      name: 'SEO Optimization Kit',
      price: 199,
      originalPrice: 249,
      rating: 4.9,
      reviews: 345,
      views: 2100,
      category: 'SEO',
      image: null,
      inStock: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/seller/dashboard')} 
              className="p-3 hover:bg-white rounded-lg border border-gray-200 transition-colors group" 
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-[#00dcaa]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
              <p className="text-gray-600 mt-2">Browse our complete collection of digital marketing products</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/seller/add-product')} 
            className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00b894] transition-colors"
          >
            Add New Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm" title="Filter by category">
                <option value="">All Categories</option>
                <option value="marketing">Marketing</option>
                <option value="content">Content</option>
                <option value="analytics">Analytics</option>
                <option value="social">Social Media</option>
                <option value="email">Email</option>
                <option value="seo">SEO</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm" title="Sort products">
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm" title="Filter by status">
                <option value="">All Products</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                <Package className="w-16 h-16 text-gray-400" />
                {!product.inStock && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Out of Stock
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50" title="Add to favorites">
                    <Heart className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{product.views} views</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                    )}
                  </div>
                  {product.originalPrice > product.price && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                      Save ${product.originalPrice - product.price}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      product.inStock
                        ? 'bg-[#00dcaa] text-white hover:bg-[#00b894]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'View Details' : 'Out of Stock'}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-2 bg-[#00dcaa] text-white rounded-lg">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
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

export default ViewAllProducts;