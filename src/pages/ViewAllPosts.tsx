import React from 'react';
import { ArrowLeft, FileText, Eye, Heart, MessageSquare, Share2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ViewAllPosts = () => {
  const navigate = useNavigate();
  
  const posts = [
    {
      id: 1,
      title: 'Summer Sale Campaign - Up to 50% Off',
      description: 'Join our biggest summer sale event with amazing discounts on all digital marketing services...',
      date: '2024-03-15',
      views: 1890,
      likes: 234,
      comments: 56,
      shares: 78,
      status: 'published',
      category: 'Promotion',
      buttonText: 'Shop Now',
      image: null
    },
    {
      id: 2,
      title: 'New Analytics Dashboard Release',
      description: 'We are excited to announce the launch of our new analytics dashboard with advanced features...',
      date: '2024-03-12',
      views: 1245,
      likes: 189,
      comments: 43,
      shares: 65,
      status: 'published',
      category: 'Product Update',
      buttonText: 'Learn More',
      image: null
    },
    {
      id: 3,
      title: 'Digital Marketing Trends 2024',
      description: 'Discover the latest trends in digital marketing that will shape the industry in 2024...',
      date: '2024-03-10',
      views: 2156,
      likes: 345,
      comments: 89,
      shares: 123,
      status: 'published',
      category: 'Education',
      buttonText: 'Read More',
      image: null
    },
    {
      id: 4,
      title: 'Customer Success Story: AdTip Helps Local Business',
      description: 'See how AdTip helped a local restaurant increase their online presence by 300%...',
      date: '2024-03-08',
      views: 987,
      likes: 156,
      comments: 34,
      shares: 45,
      status: 'draft',
      category: 'Case Study',
      buttonText: 'View Case Study',
      image: null
    },
    {
      id: 5,
      title: 'Free Webinar: Social Media Marketing Strategies',
      description: 'Join our free webinar to learn effective social media marketing strategies for small businesses...',
      date: '2024-03-05',
      views: 1567,
      likes: 278,
      comments: 67,
      shares: 89,
      status: 'published',
      category: 'Event',
      buttonText: 'Register Now',
      image: null
    },
    {
      id: 6,
      title: 'AdTip Partnership with Google Ads',
      description: 'We are proud to announce our new partnership with Google Ads to provide better advertising solutions...',
      date: '2024-03-03',
      views: 3421,
      likes: 567,
      comments: 123,
      shares: 234,
      status: 'published',
      category: 'Partnership',
      buttonText: 'Learn More',
      image: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
              <p className="text-gray-600 mt-2">Manage your company posts and announcements</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/seller/add-post')} 
            className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00b894] transition-colors"
          >
            Create New Post
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm" title="Filter by category">
                <option value="">All Categories</option>
                <option value="promotion">Promotion</option>
                <option value="product-update">Product Update</option>
                <option value="education">Education</option>
                <option value="case-study">Case Study</option>
                <option value="event">Event</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm" title="Filter by status">
                <option value="">All Posts</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm" title="Sort posts">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-viewed">Most Viewed</option>
                <option value="most-liked">Most Liked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes} likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments} comments</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares} shares</span>
                    </div>
                  </div>
                </div>
                <div className="ml-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <button className="text-[#00dcaa] hover:text-[#00b894] text-sm font-medium">
                    View Post
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                    Edit
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                    Duplicate
                  </button>
                  {post.status === 'draft' && (
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                      Publish
                    </button>
                  )}
                  {post.status === 'published' && (
                    <button className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                      Archive
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {post.buttonText && (
                    <span className="text-xs bg-[#00dcaa] text-white px-2 py-1 rounded">
                      CTA: {post.buttonText}
                    </span>
                  )}
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Delete
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

export default ViewAllPosts;