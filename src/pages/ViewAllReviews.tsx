import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Search, Filter, MessageCircle, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetCompanyReviews } from '@/api';
import { toast } from '@/hooks/use-toast';

const ViewAllReviews: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real reviews data
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const selectedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
        
        if (selectedCompany?.id) {
          const response = await apiGetCompanyReviews(selectedCompany.id);
          console.log('Reviews API response:', response);
          
          if ((response as any)?.data?.status === 200 && (response as any).data.data) {
            setReviews((response as any).data.data);
          } else {
            // Show empty state if no reviews
            setReviews([]);
          }
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: "Error",
          description: "Failed to load reviews. Please try again.",
          variant: "destructive"
        });
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  return (
    <div className="min-h-screen bg-[#f5f5ff] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 mb-8 border border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Customer Reviews</h1>
          
          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00dcaa] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6">Your customers haven't left any reviews yet. Keep providing great service!</p>
              <button 
                onClick={() => navigate('/seller/dashboard')}
                className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg hover:bg-[#00b894] transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Review Summary */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#00dcaa] mb-2">{isNaN(averageRating) ? '0.0' : averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#00dcaa] mb-2">{reviews.length}</div>
                  <div className="text-gray-600">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#00dcaa] mb-2">{reviews.length > 0 ? '98%' : '0%'}</div>
                  <div className="text-gray-600">Satisfaction Rate</div>
                </div>
              </div>
            </>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                title="Filter reviews by rating"
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {!loading && reviews.length > 0 && (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#00dcaa] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{review.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {review.product}
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{review.comment}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-[#00dcaa]">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Helpful ({review.helpful})</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-[#00dcaa]">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More */}
          {filteredReviews.length > 10 && (
            <div className="text-center mt-8">
              <button className="bg-[#00dcaa] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#00c59a] transition-colors duration-200">
                Load More Reviews
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default ViewAllReviews;