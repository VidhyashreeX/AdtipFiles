import React, { useState, useEffect } from 'react';
import { MapPin, Users, Star, Globe, Phone, Mail, Package, FileText, TrendingUp, MessageSquare, Heart, Eye, X, Edit, Building2, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  apiGetCompanyList, 
  apiGetProductList, 
  apiGetCompanyPost, 
  apiGetSellerOrders,
  apiUpdateCompany,
  apiGetRecentAdsByCompany,
  apiGetSellerAds,
  apiGetCompanyReviews,
  apiTogglePostLike,
  apiAddPostComment
} from '@/api';
import { toast } from '@/hooks/use-toast';
import { normalizeProduct, formatCurrency } from '@/utils/product';
import { useAuthModal } from '../contexts/AuthModalContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

type NormalizedPost = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  raw: any;
};

const toNumeric = (value: any, fallback = 0): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const resolveMediaUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).replace(/^"|"$/g, '').trim();
  if (!trimmed) {
    return null;
  }

  // Handle escaped URLs stored in DB
  const unescaped = trimmed.replace(new RegExp('\\/', 'g'), '/');

  if (/^https?:\/\//i.test(unescaped)) {
    return unescaped;
  }

  return `${API_BASE_URL}/api/photo/${unescaped.replace(/^\/+/, '')}`;
};

const normalizePostRecord = (raw: any): NormalizedPost => {
  const id = toNumeric(raw.id ?? raw.postId ?? raw.PostId, 0);

  const mediaCandidates = [
    raw.image_path,
    raw.imagePath,
    raw.image,
    raw.postImage,
    raw.post_image,
    raw.media_url,
    raw.filename,
    raw.fileName,
    raw.file_name,
    raw.imageFilename,
    raw.post_filename
  ]
    .map((candidate) => resolveMediaUrl(candidate))
    .filter(Boolean) as string[];

  return {
    id,
    title: raw.PostName ?? raw.title ?? raw.name ?? 'Untitled Post',
    description: raw.PostDiscription ?? raw.description ?? raw.details ?? '',
    imageUrl: mediaCandidates.length > 0 ? mediaCandidates[0] : null,
    likes: toNumeric(
      raw.likeCount ?? raw.likes ?? raw.totalLikes ?? raw.like_count ?? raw.total_likes,
      0
    ),
    comments: toNumeric(
      raw.commentCount ?? raw.comments ?? raw.comment_count ?? raw.total_comments,
      0
    ),
    views: toNumeric(
      raw.viewCount ?? raw.views ?? raw.view_count ?? raw.totalViews ?? raw.total_views,
      0
    ),
    isLiked: Boolean(raw.is_liked ?? raw.isLiked ?? raw.userLiked ?? raw.liked),
    raw,
  };
};

const SellerDashboard = () => {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [recentAds, setRecentAds] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [hasCompany, setHasCompany] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({
    companyName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    description: '',
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

  // Fetch seller dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
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
          openLoginModal();
          return;
        }

        console.log('Fetching companies for user:', userId);

        // Fetch user's companies with better error handling
        try {
          const companiesResponse = await apiGetCompanyList(userId.toString());
          console.log('Companies API response:', companiesResponse);
          
          if (companiesResponse?.data?.status === 200) {
            const companiesList = companiesResponse.data.data || [];
            console.log('Companies list:', companiesList);
            setCompanies(companiesList);
            
            // Check if user has any companies
            if (companiesList.length === 0) {
              console.log('No companies found, redirecting to registration');
              setHasCompany(false);
              toast({
                title: "No Company Found",
                description: "Please create a company profile to access the seller dashboard.",
                variant: "default"
              });
              navigate('/seller/register');
              return;
            }

            setHasCompany(true);
            
            // Use the first company as selected company, or the one from localStorage
            const storedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
            const selectedComp = storedCompany.id ? 
              companiesList.find((c: any) => c.id === storedCompany.id) || companiesList[0] :
              companiesList[0];
            
            if (selectedComp) {
              console.log('Selected company:', selectedComp);
              console.log('All available fields:', Object.keys(selectedComp));
              
              // Debug all possible image fields
              console.log('Logo-related fields:', {
                logoUrl: selectedComp.logoUrl,
                profileImage: selectedComp.profileImage,
                profileFilename: selectedComp.profileFilename,
                logo: selectedComp.logo,
                companyLogo: selectedComp.companyLogo,
                image: selectedComp.image,
                filename: selectedComp.filename
              });
              
              console.log('Banner-related fields:', {
                bannerUrl: selectedComp.bannerUrl,
                coverImage: selectedComp.coverImage,
                coverFilename: selectedComp.coverFilename,
                banner: selectedComp.banner,
                companyBanner: selectedComp.companyBanner,
                cover: selectedComp.cover
              });
              
              setSelectedCompany(selectedComp);
              localStorage.setItem('selectedCompany', JSON.stringify(selectedComp));
              
              // Build proper image URLs - handle both backend URLs and direct database values
              // Check if backend already created full URLs
              let logoUrl = null;
              if (selectedComp.profileImage && selectedComp.profileImage.startsWith('http')) {
                logoUrl = selectedComp.profileImage;
              } else if (selectedComp.profileFilename) {
                logoUrl = `https://api.adtip.in/api/photo/${selectedComp.profileFilename}`;
              } else if (selectedComp.profileimage && typeof selectedComp.profileimage === 'string' && selectedComp.profileimage.startsWith('http')) {
                logoUrl = selectedComp.profileimage; // Direct URL from database
              }
              
              let bannerUrl = null;
              if (selectedComp.coverImage && selectedComp.coverImage.startsWith('http')) {
                bannerUrl = selectedComp.coverImage;
              } else if (selectedComp.coverFilename) {
                bannerUrl = `https://api.adtip.in/api/photo/${selectedComp.coverFilename}`;
              } else if (selectedComp.coverimage && typeof selectedComp.coverimage === 'string' && selectedComp.coverimage.startsWith('http')) {
                bannerUrl = selectedComp.coverimage; // Direct URL from database
              }
              
              console.log('Final constructed URLs:', { logoUrl, bannerUrl });
              
              setSellerInfo({
                companyName: selectedComp.name || '',
                email: selectedComp.email || '',
                phone: selectedComp.phone || '',
                website: selectedComp.website || '',
                address: selectedComp.location || selectedComp.address || '',
                description: selectedComp.about || selectedComp.description || '',
                logo: logoUrl || '/default-logo.png', // Add default logo if none exists
                banner: bannerUrl || '/default-banner.jpg' // Add default banner if none exists
              });

              // Fetch products for selected company - don't fail if this fails
              try {
                console.log('Fetching products for company:', selectedComp.id);
                const productsResponse = await apiGetProductList(selectedComp.id.toString());
                if (productsResponse?.data?.status === 200) {
                  setProducts(productsResponse.data.data || []);
                  console.log('Products loaded:', productsResponse.data.data?.length || 0);
                } else {
                  console.log('No products found or API error');
                  setProducts([]);
                }
              } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
                // Don't show error toast for products - just log it
              }

              // Fetch posts for selected company - don't fail if this fails
              try {
                console.log('Fetching posts for company:', selectedComp.id);
                const postsResponse = await apiGetCompanyPost(selectedComp.id.toString());
                if (postsResponse?.data?.status === 200) {
                  setPosts(postsResponse.data.data || []);
                  console.log('Posts loaded:', postsResponse.data.data?.length || 0);
                } else {
                  console.log('No posts found or API error');
                  setPosts([]);
                }
              } catch (error) {
                console.error('Error fetching posts:', error);
                setPosts([]);
                // Don't show error toast for posts - just log it
              }

              // Fetch recent ads for selected company
              try {
                console.log('Fetching recent ads for company:', selectedComp.id);
                const adsResponse = await apiGetRecentAdsByCompany(selectedComp.id.toString(), userId.toString());
                if (adsResponse?.data?.status === 200) {
                  setRecentAds(adsResponse.data.data || []);
                  console.log('Ads loaded:', adsResponse.data.data?.length || 0);
                } else {
                  setRecentAds([]);
                }
              } catch (error) {
                console.error('Error fetching recent ads:', error);
                setRecentAds([]);
              }

              // Fetch company reviews
              try {
                console.log('Fetching reviews for company:', selectedComp.id);
                const reviewsResponse: any = await apiGetCompanyReviews(selectedComp.id.toString());
                if (reviewsResponse?.data?.status === 200) {
                  setReviews(reviewsResponse.data.data || []);
                  console.log('Reviews loaded:', reviewsResponse.data.data?.length || 0);
                } else {
                  setReviews([]);
                }
              } catch (error) {
                console.error('Error fetching reviews:', error);
                setReviews([]);
              }
            }
          } else if (companiesResponse?.data?.status === 404 || 
                     companiesResponse?.data?.message?.includes('not found') ||
                     !companiesResponse?.data?.data?.length) {
            // No companies found
            console.log('No companies found for user');
            setHasCompany(false);
            setCompanies([]);
            toast({
              title: "No Company Found",
              description: "Please create a company profile to access the seller dashboard.",
              variant: "default"
            });
            navigate('/seller/register');
            return;
          } else {
            throw new Error(companiesResponse?.data?.message || 'Failed to fetch companies');
          }
        } catch (companiesError: any) {
          console.error('Error fetching companies:', companiesError);
          
          // Check if it's a 404 or no data error
          if (companiesError.response?.status === 404 || 
              companiesError.response?.data?.message?.includes('not found') ||
              companiesError.message?.includes('not found')) {
            console.log('No companies found (404), redirecting to registration');
            setHasCompany(false);
            setCompanies([]);
            toast({
              title: "No Company Found",
              description: "Please create a company profile to access the seller dashboard.",
              variant: "default"
            });
            navigate('/seller/register');
            return;
          } else {
            // For other errors, show error but don't redirect if we might have companies
            console.error('API Error loading companies:', companiesError);
            toast({
              title: "Error Loading Companies",
              description: "There was an error loading your company data. Please try refreshing the page.",
              variant: "destructive"
            });
            // Don't redirect, let the dashboard show with limited functionality
            setHasCompany(false);
            setCompanies([]);
          }
        }

        // Fetch seller orders - don't fail if this fails
        try {
          console.log('Fetching orders for user:', userId);
          const ordersResponse = await apiGetSellerOrders(userId.toString());
          if (ordersResponse?.data?.status === 200) {
            setOrders(ordersResponse.data.data || []);
            console.log('Orders loaded:', ordersResponse.data.data?.length || 0);
          } else {
            setOrders([]);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          setOrders([]);
          // Don't show error toast for orders - just log it
        }

      } catch (error: any) {
        console.error('Error in fetchDashboardData:', error);
        toast({
          title: "Error",
          description: "Failed to load some dashboard data. Some features may not work correctly.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5ff] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00dcaa] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5ff] dark:bg-gray-900">
      {/* Company Profile Header */}
      <div className="relative">
        {/* Banner Background */}
        <div className="h-72 relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          {sellerInfo.banner ? (
            <>
              <img
                src={typeof sellerInfo.banner === 'string' ? sellerInfo.banner : URL.createObjectURL(sellerInfo.banner)}
                alt="Company Banner"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/15" />
            </>
          ) : null}
        </div>
        
        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8 -mt-16 pb-8">
            {/* Company Information */}
            <div className="text-center md:text-left flex-1">
              <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                {/* Company Header with Logo beside title */}
                <div className="flex items-center space-x-4 mb-4">
                  {/* Company Logo */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-lg border-4 border-border">
                      {sellerInfo.logo ? (
                        <img 
                          src={typeof sellerInfo.logo === 'string' ? sellerInfo.logo : URL.createObjectURL(sellerInfo.logo)}
                          alt="Company Logo"
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-gradient-to-r from-[#00dcaa] to-[#00b894] rounded-full flex items-center justify-center ${sellerInfo.logo ? 'hidden' : ''}`}>
                        <span className="text-white font-bold text-xl">
                          {(sellerInfo.companyName || 'C').charAt(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Company Title and Number */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h1 className="text-3xl font-bold text-gray-900">{sellerInfo.companyName}</h1>
                      {companies.length > 1 && (
                        <select 
                          value={selectedCompany?.id || ''}
                          onChange={(e) => {
                            const companyId = parseInt(e.target.value);
                            const company = companies.find(c => c.id === companyId);
                            if (company) {
                              setSelectedCompany(company);
                              localStorage.setItem('selectedCompany', JSON.stringify(company));
                              // Refresh data for new company
                              window.location.reload();
                            }
                          }}
                          className="text-sm bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#00dcaa]"
                          title="Switch Company"
                        >
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Verified Business
                      </span>
                      {companies.length > 1 && (
                        <span className="text-blue-500 text-sm">({companies.length} companies)</span>
                      )}
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
                <div className="flex justify-center md:justify-start space-x-3 flex-wrap gap-2">
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-[#00b894] hover:to-[#00a085] transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Edit Info
                  </button>
                  <button 
                    onClick={() => navigate('/seller/register')}
                    className="bg-card border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    + New Company
                  </button>
                  <button 
                    onClick={() => navigate('/seller/ad-orders')}
                    className="bg-card border-2 border-[#00dcaa] text-[#00dcaa] hover:bg-[#00dcaa] hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
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
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Top products</h2>
                <button 
                  className="bg-[#00dcaa] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                  onClick={() => navigate('/seller/add-product')}
                >
                  Add Product
                </button>
              </div>
              <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {products.length > 0 ? products.map((rawProduct) => {
                  const product = normalizeProduct(rawProduct);
                  return (
                    <div key={product.id} className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[240px] max-w-[240px] flex-shrink-0">
                      <div className="w-full h-28 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.primaryImage ? (
                          <img 
                            src={product.primaryImage}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                              const icon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                              if (icon) icon.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <Package className="w-10 h-10 text-gray-400" />
                        )}
                        <Package className="w-10 h-10 text-gray-400 fallback-icon hidden" />
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mb-2 truncate">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg font-bold text-[#00dcaa]">
                          {formatCurrency(product.price)}
                        </span>
                        {product.marketPrice > product.regularPrice && (
                          <>
                            <span className="text-xs text-gray-400 line-through">{formatCurrency(product.marketPrice)}</span>
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                              {Math.round((1 - product.regularPrice / product.marketPrice) * 100)}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {product.totalLikes}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {product.totalViews}
                        </span>
                        <span>Stock: {product.stock}</span>
                      </div>
                      <div className="space-y-2">
                        <button 
                          className="w-full bg-[#00dcaa] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                          onClick={() => navigate('/post-ads')}
                        >
                          Promote ⭐
                        </button>
                        <div className="flex space-x-1.5">
                          <button 
                            className="flex-1 border border-[#00dcaa] text-[#00dcaa] py-1.5 px-2 rounded text-xs font-medium hover:bg-[#00dcaa] hover:text-white transition-colors"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            View
                          </button>
                          <button className="flex-1 border border-[#00dcaa] text-[#00dcaa] py-1.5 px-2 rounded text-xs font-medium hover:bg-[#00dcaa] hover:text-white transition-colors">
                            Likes
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex items-center justify-center w-full py-12">
                    <div className="text-center">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No products yet</p>
                      <button 
                        onClick={() => navigate('/seller/add-product')}
                        className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg hover:bg-[#00c59a] transition-colors"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  </div>
                )}
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
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Posts</h2>
                <button 
                  className="bg-[#00dcaa] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                  onClick={() => navigate('/seller/add-post')}
                >
                  Add Post
                </button>
              </div>
              <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {posts.length > 0 ? posts.map((post) => (
                  <div key={post.id} className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[240px] max-w-[240px] flex-shrink-0">
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="w-6 h-6 bg-[#00dcaa] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {(selectedCompany?.name || 'C')[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate block">
                          {selectedCompany?.name || 'Company'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {post.image || post.filename || post.post_image ? (
                        <img 
                          src={
                            post.image || 
                            (post.filename ? `https://api.adtip.in/api/photo/${post.filename}` : '') ||
                            (post.post_image ? `https://api.adtip.in/api/photo/${post.post_image}` : '')
                          }
                          alt={post.title || post.name || 'Post'}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            const icon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (icon) icon.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <FileText className="w-8 h-8 text-gray-400 fallback-icon" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2 truncate">{post.title || post.name}</h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{post.description || post.details}</p>
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
                        onClick={() => navigate('/post-ads')}
                      >
                        Promote ⭐
                      </button>
                      <button className="w-full border border-[#00dcaa] text-[#00dcaa] py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-[#00dcaa] hover:text-white transition-colors">
                        Like
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center justify-center w-full py-12">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No posts yet</p>
                      <button 
                        onClick={() => navigate('/seller/add-post')}
                        className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg hover:bg-[#00c59a] transition-colors"
                      >
                        Create Your First Post
                      </button>
                    </div>
                  </div>
                )}
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
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Recent Ads</h2>
                <button 
                  className="bg-[#00dcaa] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                  onClick={() => navigate('/post-ads')}
                >
                  Book Ad
                </button>
              </div>
              <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {recentAds.length > 0 ? recentAds.map((ad) => (
                  <div key={ad.id} className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[240px] max-w-[240px] flex-shrink-0">
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="w-6 h-6 bg-[#00dcaa] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {(ad.company_name || selectedCompany?.name || 'A')[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate block">
                          {ad.company_name || selectedCompany?.name || 'Company'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {ad.ad_upload_filename ? (
                        <img 
                          src={`https://api.adtip.in/api/photo/${ad.ad_upload_filename}`}
                          alt={ad.campaign_name || ad.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2 truncate">
                      {ad.campaign_name || ad.title || 'Ad Campaign'}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {ad.ad_description || ad.description || 'Advertising campaign'}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {ad.ad_start_date && (
                          <span className="text-xs text-gray-500">
                            {new Date(ad.ad_start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="flex items-center space-x-1" title="Views">
                          <Eye className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{ad.views || 0}</span>
                        </button>
                        <button className="flex items-center space-x-1" title="Likes">
                          <Heart className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{ad.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button 
                        className="w-full bg-[#00dcaa] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#00c59a] transition-colors"
                        onClick={() => navigate('/seller/ad-orders')}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center justify-center w-full py-12">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No ads yet</p>
                      <button 
                        onClick={() => navigate('/post-ads')}
                        className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg hover:bg-[#00c59a] transition-colors"
                      >
                        Create Your First Ad
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-6">
                <button 
                  className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#00b894] hover:to-[#00a085] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => navigate('/seller/ad-orders')}
                >
                  View All Ads
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* About Company */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">About {sellerInfo.companyName || 'Company'}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {sellerInfo.description || 'Company description not provided.'}
              </p>
              <div className="space-y-3">
                {sellerInfo.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a 
                      href={sellerInfo.website.startsWith('http') ? sellerInfo.website : `https://${sellerInfo.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#00dcaa] hover:underline"
                    >
                      {sellerInfo.website}
                    </a>
                  </div>
                )}
                {sellerInfo.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a 
                      href={`tel:${sellerInfo.phone}`}
                      className="text-sm text-gray-600 hover:text-[#00dcaa]"
                    >
                      {sellerInfo.phone}
                    </a>
                  </div>
                )}
                {sellerInfo.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a 
                      href={`mailto:${sellerInfo.email}`}
                      className="text-sm text-gray-600 hover:text-[#00dcaa]"
                    >
                      {sellerInfo.email}
                    </a>
                  </div>
                )}
                
                {/* Company Stats */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{products.length}</div>
                      <div className="text-xs text-gray-500">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{posts.length}</div>
                      <div className="text-xs text-gray-500">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{orders.length}</div>
                      <div className="text-xs text-gray-500">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{recentAds.length}</div>
                      <div className="text-xs text-gray-500">Active Ads</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Location */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Company Location</h2>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Map View</p>
                  <p className="text-xs text-gray-500">
                    {sellerInfo.address ? 
                      sellerInfo.address.split(',').slice(-2).join(',').trim() || sellerInfo.address : 
                      'Location not set'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#00dcaa]" />
                <span className="text-sm font-medium text-gray-900">
                  {sellerInfo.address || 'Company address not provided'}
                </span>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Customer Reviews</h2>
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.slice(0, 3).map((review, index) => (
                  <div key={review.id || index} className="border-b border-gray-100 pb-4 last:border-b-0">
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
                        {review.date && (
                          <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No reviews yet</p>
                    <p className="text-xs text-gray-400">Reviews from customers will appear here</p>
                  </div>
                )}
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
      <footer className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-800 py-12 mt-12">
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
      {/* Edit Info Modal - Modern Design */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Company Profile</h2>
                  <p className="text-indigo-100 text-sm mt-1">Update your business information</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  title="Close modal"
                  aria-label="Close edit modal"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-8">
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (!selectedCompany) {
                toast({
                  title: "Error",
                  description: "No company selected for update.",
                  variant: "destructive"
                });
                return;
              }

              try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                const updateData = {
                  id: selectedCompany.id,
                  name: sellerInfo.companyName,
                  email: sellerInfo.email,
                  phone: sellerInfo.phone,
                  website: sellerInfo.website,
                  location: sellerInfo.address,
                  about: sellerInfo.description,
                  userId: userData.id
                };

                console.log('Updating company with data:', updateData);
                const response = await apiUpdateCompany(updateData);
                
                if (response.data && response.data.status === 200) {
                  // Update local state
                  const updatedCompany = { ...selectedCompany, ...updateData };
                  setSelectedCompany(updatedCompany);
                  localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));
                  
                  // Update companies list
                  setCompanies(prev => prev.map(company => 
                    company.id === selectedCompany.id ? updatedCompany : company
                  ));

                  toast({
                    title: "Success",
                    description: "Company information updated successfully!",
                    variant: "default"
                  });
                  
                  setShowEditModal(false);
                } else {
                  throw new Error(response.data?.message || 'Failed to update company');
                }
              } catch (error: any) {
                console.error('Error updating company:', error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to update company information.",
                  variant: "destructive"
                });
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center" htmlFor="companyName">
                    <Building2 className="w-4 h-4 mr-2 text-indigo-500" />
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={sellerInfo.companyName}
                    onChange={(e) => setSellerInfo({...sellerInfo, companyName: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium"
                    placeholder="Enter your company name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center" htmlFor="email">
                    <Mail className="w-4 h-4 mr-2 text-purple-500" />
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={sellerInfo.email}
                    onChange={(e) => setSellerInfo({...sellerInfo, email: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
                    placeholder="company@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center" htmlFor="phone">
                    <Phone className="w-4 h-4 mr-2 text-green-500" />
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={sellerInfo.phone}
                    onChange={(e) => setSellerInfo({...sellerInfo, phone: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center" htmlFor="website">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={sellerInfo.website}
                    onChange={(e) => setSellerInfo({...sellerInfo, website: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                    placeholder="https://your-website.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center" htmlFor="address">
                    <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                    Address *
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={sellerInfo.address}
                    onChange={(e) => setSellerInfo({...sellerInfo, address: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium"
                    placeholder="City, State, Country"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center" htmlFor="description">
                  <FileText className="w-4 h-4 mr-2 text-teal-500" />
                  Company Description *
                </label>
                <textarea
                  id="description"
                  value={sellerInfo.description}
                  onChange={(e) => setSellerInfo({...sellerInfo, description: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium resize-none"
                  placeholder="Describe your company, services, and what makes you unique..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;