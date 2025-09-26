import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Star, Eye, Heart, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetCompanyList, apiGetProductList, apiDeleteProduct } from '@/api';
import { toast } from '@/hooks/use-toast';

const ViewAllProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

        // Fetch user's companies
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

          // Get selected company
          const storedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
          const selectedComp = storedCompany.id ? 
            companiesList.find((c: any) => c.id === storedCompany.id) || companiesList[0] :
            companiesList[0];
          
          setSelectedCompany(selectedComp);

          // Fetch products for selected company
          if (selectedComp) {
            const productsResponse = await apiGetProductList(selectedComp.id.toString());
            if (productsResponse.data && productsResponse.data.status === 200) {
              setProducts(productsResponse.data.data || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load products data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await apiDeleteProduct({ id: productId });
      if (response.data && response.data.status === 200) {
        setProducts(prev => prev.filter(product => product.id !== productId));
        toast({
          title: "Success",
          description: "Product deleted successfully!",
          variant: "default"
        });
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00dcaa] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

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
              <p className="text-gray-600 mt-2">
                {selectedCompany ? `Products for ${selectedCompany.name}` : 'Manage your product catalog'}
              </p>
              {products.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
              )}
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
          {products.length > 0 ? products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {product.image || product.filename ? (
                  <img 
                    src={product.image || `https://api.adtip.in/api/photo/${product.filename}`}
                    alt={product.name || product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-400" />
                )}
                {product.unitsAvailable === 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Out of Stock
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button 
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors" 
                    title="Add to favorites"
                    onClick={() => {
                      // Toggle like functionality
                      toast({
                        title: "Feature Coming Soon",
                        description: "Favorites functionality will be available soon!",
                        variant: "default"
                      });
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{product.name || product.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {product.category || 'General'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description || product.details || 'No description available'}
                </p>

                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {product.unitsAvailable || 0} units available
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price || product.selprice || '0'}
                    </span>
                    {product.marketPrice && product.marketPrice > (product.price || product.selprice || 0) && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.marketPrice}
                      </span>
                    )}
                  </div>
                  {product.marketPrice && product.marketPrice > (product.price || product.selprice || 0) && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                      Save ${product.marketPrice - (product.price || product.selprice || 0)}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    className="flex-1 px-4 py-2 bg-[#00dcaa] text-white rounded-lg hover:bg-[#00b894] transition-colors font-medium"
                    onClick={() => navigate('/seller/ad-model')}
                  >
                    Promote
                  </button>
                  <button 
                    className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => handleDeleteProduct(product.id)}
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No products found</p>
                <button 
                  onClick={() => navigate('/seller/add-product')}
                  className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg hover:bg-[#00c59a] transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Product</span>
                </button>
              </div>
            </div>
          )}
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