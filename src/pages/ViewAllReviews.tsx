import React, { useState } from 'react';
import { ArrowLeft, Star, Search, Filter, MessageCircle, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ViewAllReviews: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  const reviews = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: 'SJ',
      rating: 5,
      date: '2024-01-15',
      comment: 'Excellent service and great results! The ad campaigns exceeded my expectations and brought in quality leads.',
      helpful: 12,
      product: 'Premium Campaign'
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: 'MC',
      rating: 5,
      date: '2024-01-12',
      comment: 'Very professional and effective campaigns. The team was responsive and delivered everything on time.',
      helpful: 8,
      product: 'Targeted Ads'
    },
    {
      id: 3,
      name: 'Lisa Davis',
      avatar: 'LD',
      rating: 4,
      date: '2024-01-10',
      comment: 'Good experience overall, would recommend. Some minor issues with setup but support resolved quickly.',
      helpful: 6,
      product: 'Community Ads'
    },
    {
      id: 4,
      name: 'David Wilson',
      avatar: 'DW',
      rating: 5,
      date: '2024-01-08',
      comment: 'Outstanding ROI on our ad spend. The analytics dashboard is very helpful for tracking performance.',
      helpful: 15,
      product: 'Growth Package'
    },
    {
      id: 5,
      name: 'Emily Brown',
      avatar: 'EB',
      rating: 4,
      date: '2024-01-05',
      comment: 'Great platform with excellent features. Easy to use interface and good customer support.',
      helpful: 9,
      product: 'Conversation Ads'
    },
    {
      id: 6,
      name: 'James Taylor',
      avatar: 'JT',
      rating: 5,
      date: '2024-01-03',
      comment: 'Best advertising platform I have used. The results speak for themselves. Highly recommended!',
      helpful: 18,
      product: 'Premium Campaign'
    }
  ];

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

        <div className="bg-white rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h1>
          
          {/* Review Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00dcaa] mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00dcaa] mb-2">{reviews.length}</div>
              <div className="text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00dcaa] mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>

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
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg p-6 shadow-sm">
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
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-[#00dcaa] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#00c59a] transition-colors duration-200">
            Load More Reviews
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAllReviews;