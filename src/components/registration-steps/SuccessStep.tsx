import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Star, ArrowRight, Gift, Users, TrendingUp } from 'lucide-react';
import { FormData } from '../SellerRegistration';

interface SuccessStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ formData }) => {
  return (
    <div className="space-y-8 text-center">
      <div className="relative">
        <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <Star className="w-4 h-4 text-yellow-800" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">Welcome to Our Marketplace!</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Congratulations, <span className="font-semibold text-[#00dcaa]">{formData.personalInfo.fullName}</span>! 
          Your seller account has been successfully created.
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#00dcaa]/10 to-green-50 rounded-2xl p-8 border border-green-100">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-[#00dcaa]" />
          <h3 className="text-xl font-semibold text-gray-800">Next Steps</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Check Your Email</h4>
            <p className="text-sm text-gray-600">We've sent verification instructions to {formData.personalInfo.email}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Complete Profile</h4>
            <p className="text-sm text-gray-600">Add more details to your store profile to attract customers</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Start Selling</h4>
            <p className="text-sm text-gray-600">Upload your first products and start earning money</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Gift className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-800">Special Welcome Offer!</h3>
        </div>
        <p className="text-gray-700 mb-4">
          As a new seller, enjoy <span className="font-bold text-orange-600">0% commission</span> on your first 10 sales!
        </p>
        <div className="text-sm text-gray-600">
          <p>• No setup fees for the first month</p>
          <p>• Access to premium seller tools</p>
          <p>• Dedicated customer support</p>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          className="bg-gradient-to-r from-[#00dcaa] to-[#00dcaa]/90 hover:from-[#00dcaa]/90 hover:to-[#00dcaa]/80 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-3"
        >
          Go to Seller Dashboard
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;