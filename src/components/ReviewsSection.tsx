import React from 'react';
import { Star, User } from 'lucide-react';

const ReviewsSection = () => {
  const reviews = [
    {
      id: 1,
      name: "Sarah Johnson",
      title: "Marketing Director",
      company: "TechCorp",
      rating: 5,
      review: "AdTip has transformed our digital marketing strategy. The ROI we've seen is incredible!",
      date: "2 weeks ago"
    },
    {
      id: 2,
      name: "Mike Chen",
      title: "Content Creator",
      company: "Independent",
      rating: 5,
      review: "The content creator suite is amazing. Premium uploads and analytics have boosted my revenue by 300%!",
      date: "1 month ago"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      title: "CEO",
      company: "StartupXYZ",
      rating: 4,
      review: "Great platform with excellent customer support. The analytics tools are very comprehensive.",
      date: "3 weeks ago"
    },
    {
      id: 4,
      name: "David Kim",
      title: "Digital Marketer",
      company: "Agency Pro",
      rating: 5,
      review: "Best advertising platform I've used. The AI optimization features save us hours of work.",
      date: "1 week ago"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {renderStars(5)}
          </div>
          <span className="text-lg font-semibold text-gray-900">4.8</span>
          <span className="text-gray-600">(1,234 reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-[#f5f5ff] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#00dcaa]" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <p className="text-sm text-gray-600">{review.title} at {review.company}</p>
                  </div>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
                
                <div className="flex items-center space-x-1 mb-2">
                  {renderStars(review.rating)}
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed">{review.review}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button className="text-[#00dcaa] hover:text-[#00b894] font-medium">
          View All Reviews
        </button>
      </div>
    </div>
  );
};

export default ReviewsSection;