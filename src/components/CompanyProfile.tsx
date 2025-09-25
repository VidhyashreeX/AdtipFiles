import React from 'react';
import { MapPin, Users, Star, Globe, Phone, Mail } from 'lucide-react';

const CompanyProfile = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-[#00dcaa] to-[#00b894] rounded-t-lg relative">
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-lg"></div>
      </div>

      {/* Company Info */}
      <div className="px-6 pb-6">
        <div className="flex items-start space-x-4 -mt-16 relative z-10">
          <div className="w-32 h-32 bg-white rounded-lg border-4 border-white shadow-lg flex items-center justify-center">
            <div className="w-24 h-24 bg-[#00dcaa] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-4xl">▶</span>
            </div>
          </div>
          
          <div className="flex-1 mt-16">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AdTip</h1>
                <p className="text-lg text-gray-600 mt-1">Digital Marketing & Advertising Solutions</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>25,847 followers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>4.8 (1,234 reviews)</span>
                  </div>
                </div>
              </div>
              
              <button className="bg-[#00dcaa] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#00b894] transition-colors">
                + Follow
              </button>
            </div>
          </div>
        </div>

        {/* Company Description */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">About AdTip</h2>
          <p className="text-gray-700 leading-relaxed">
            AdTip is a leading digital marketing platform that empowers businesses to create, manage, and optimize their advertising campaigns across multiple channels. We provide innovative solutions for content creators, businesses, and marketers to maximize their reach and engagement.
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Globe className="w-4 h-4" />
            <span>www.adtip.com</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span>contact@adtip.com</span>
          </div>
        </div>

        {/* Social Handles */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="bg-[#f5f5ff] text-[#00dcaa] px-4 py-2 rounded-lg hover:bg-[#00dcaa] hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="#" className="bg-[#f5f5ff] text-[#00dcaa] px-4 py-2 rounded-lg hover:bg-[#00dcaa] hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="bg-[#f5f5ff] text-[#00dcaa] px-4 py-2 rounded-lg hover:bg-[#00dcaa] hover:text-white transition-colors">
              Instagram
            </a>
            <a href="#" className="bg-[#f5f5ff] text-[#00dcaa] px-4 py-2 rounded-lg hover:bg-[#00dcaa] hover:text-white transition-colors">
              YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;