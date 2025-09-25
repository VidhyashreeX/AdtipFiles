import React from 'react';
import { ArrowRight, Target, TrendingUp, Users, Zap } from 'lucide-react';

const ProductsSection = () => {
  const products = [
    {
      id: 1,
      name: "Smart Ad Campaigns",
      description: "AI-powered advertising campaigns that optimize automatically for better ROI",
      icon: Target,
      features: ["Auto-optimization", "Multi-platform", "Real-time analytics"],
      price: "Starting at $99/month"
    },
    {
      id: 2,
      name: "Content Creator Suite",
      description: "Complete toolkit for content creators to monetize and grow their audience",
      icon: Users,
      features: ["Premium uploads", "Analytics dashboard", "Revenue tracking"],
      price: "Starting at $49/month"
    },
    {
      id: 3,
      name: "Performance Analytics",
      description: "Advanced analytics and reporting tools for data-driven marketing decisions",
      icon: TrendingUp,
      features: ["Custom reports", "ROI tracking", "Competitor analysis"],
      price: "Starting at $79/month"
    },
    {
      id: 4,
      name: "Instant Boost",
      description: "Quick promotional tools for immediate visibility and engagement boost",
      icon: Zap,
      features: ["Instant promotion", "Targeted reach", "24/7 support"],
      price: "Starting at $29/month"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Our Products & Services</h2>
        <button className="text-[#00dcaa] hover:text-[#00b894] font-medium flex items-center space-x-1">
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-[#f5f5ff] rounded-lg flex items-center justify-center">
                <product.icon className="w-6 h-6 text-[#00dcaa]" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#00dcaa] rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-[#00dcaa]">{product.price}</span>
                  <button className="bg-[#00dcaa] text-white px-6 py-2 rounded-lg hover:bg-[#00b894] transition-colors font-medium">
                    Promote Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsSection;