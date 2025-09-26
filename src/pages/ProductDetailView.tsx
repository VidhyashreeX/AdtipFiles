import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share, Eye, ShoppingCart, Star, MapPin, Clock, Package } from 'lucide-react';
import { apiGetProductDetails, apiSaveProductDetails } from '@/api';
import { normalizeProduct, formatCurrency } from '@/utils/product';
import { toast } from '@/hooks/use-toast';

const ProductDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.id || 1;

        if (!id) {
          throw new Error('Product ID not provided');
        }

        const response = await apiGetProductDetails(id, userId);
        
        if (response.data && response.data.status === 200 && response.data.data) {
          const rawProduct = Array.isArray(response.data.data) 
            ? response.data.data[0] 
            : response.data.data;
          
          const normalizedProduct = normalizeProduct(rawProduct);
          setProduct(normalizedProduct);
        } else {
          throw new Error('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleLike = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id || 1;

      await apiSaveProductDetails({
        productId: product.id,
        userId: userId,
        action: 'like'
      });

      setLiked(!liked);
      setProduct(prev => ({
        ...prev,
        totalLikes: liked ? prev.totalLikes - 1 : prev.totalLikes + 1
      }));

      toast({
        title: liked ? "Removed from favorites" : "Added to favorites",
        description: liked ? "Product removed from your favorites" : "Product added to your favorites",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
        variant: "default"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="w-full h-96 bg-gray-200"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-[#00dcaa] text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Share product"
          >
            <Share className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLike}
            className={`p-2 hover:bg-gray-100 rounded-full ${liked ? 'text-red-500' : 'text-gray-700'}`}
            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Images */}
      <div className="relative">
        <div className="w-full h-96 bg-gray-100 overflow-hidden">
          {product.imageUrls.length > 0 ? (
            <img 
              src={product.imageUrls[currentImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 text-gray-300" />
            </div>
          )}
        </div>
        
        {/* Image Dots */}
        {product.imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {product.imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Stats Overlay */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
          <Eye className="w-4 h-4" />
          <span>{product.totalViews}</span>
          <Heart className="w-4 h-4" />
          <span>{product.totalLikes}</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.totalRatings) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">({product.totalRatings})</span>
              </div>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{product.stock} in stock</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-3xl font-bold text-[#00dcaa]">
            {formatCurrency(product.price)}
          </span>
          {product.marketPrice > product.regularPrice && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatCurrency(product.marketPrice)}
              </span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-semibold">
                {Math.round((1 - product.regularPrice / product.marketPrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Size Options */}
        {product.sizeOptions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Available Sizes</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizeOptions.map((size, index) => (
                <button
                  key={index}
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:border-[#00dcaa] hover:text-[#00dcaa] transition-colors"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button className="w-full bg-[#00dcaa] text-white py-4 rounded-lg text-lg font-semibold hover:bg-[#00c59a] transition-colors flex items-center justify-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Add to Cart</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="border border-[#00dcaa] text-[#00dcaa] py-3 rounded-lg font-semibold hover:bg-[#00dcaa] hover:text-white transition-colors">
              Buy Now
            </button>
            <button className="border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Contact Seller
            </button>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5 text-[#00dcaa]" />
            <span className="font-medium">Delivery Information</span>
          </div>
          <p className="text-sm text-gray-600">
            Estimated delivery in 2-5 business days
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;