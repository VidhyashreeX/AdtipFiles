import React from 'react';
import { Bell, Search, MessageSquare, Users, Building2 } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#00dcaa] rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">▶</span>
              </div>
              <span className="text-2xl font-bold text-[#00dcaa]">AdTip</span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-700 hover:text-[#00dcaa] font-medium">Home</a>
              <a href="#" className="text-gray-700 hover:text-[#00dcaa] font-medium">Products</a>
              <a href="#" className="text-gray-700 hover:text-[#00dcaa] font-medium">Services</a>
              <a href="#" className="text-gray-700 hover:text-[#00dcaa] font-medium">About</a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-[#f5f5ff] focus:outline-none focus:border-[#00dcaa]"
              />
            </div>
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-[#00dcaa]" />
            <MessageSquare className="w-5 h-5 text-gray-600 cursor-pointer hover:text-[#00dcaa]" />
            <Users className="w-5 h-5 text-gray-600 cursor-pointer hover:text-[#00dcaa]" />
            <div className="w-8 h-8 bg-[#00dcaa] rounded-full flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;