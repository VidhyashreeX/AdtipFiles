import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Store, Upload, Image, Tag, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { FormData } from '../SellerRegistration';

interface StoreSetupStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const StoreSetupStep: React.FC<StoreSetupStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const handleInputChange = (field: string, value: string) => {
    updateFormData('storeSetup', { [field]: value });
  };

  const handleFileChange = (field: string, file: File | null) => {
    updateFormData('storeSetup', { [field]: file });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 border border-blue-100 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Store Setup & Branding</h3>
            <p className="text-gray-600 text-sm mt-1">
              Create an attractive storefront that represents your brand and attracts customers.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3 group">
          <Label htmlFor="storeName" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-emerald-600" />
            </div>
            Store Name <span className="text-red-500 text-lg">*</span>
          </Label>
          <Input
            id="storeName"
            value={formData.storeSetup.storeName}
            onChange={(e) => handleInputChange('storeName', e.target.value)}
            placeholder="Choose a unique store name"
            className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
          />
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
            💡 This will be your store URL: <span className="font-mono text-[#00dcaa]">yourstore.marketplace.com</span>
          </p>
        </div>

        <div className="space-y-3 group">
          <Label className="text-gray-700 font-semibold flex items-center gap-3 text-base">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-purple-600" />
            </div>
            Store Category <span className="text-red-500 text-lg">*</span>
          </Label>
          <Select onValueChange={(value) => handleInputChange('storeCategory', value)}>
            <SelectTrigger className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300">
              <SelectValue placeholder="Select your primary category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="electronics" className="rounded-lg">📱 Electronics</SelectItem>
              <SelectItem value="fashion" className="rounded-lg">👕 Fashion & Apparel</SelectItem>
              <SelectItem value="home" className="rounded-lg">🏠 Home & Garden</SelectItem>
              <SelectItem value="beauty" className="rounded-lg">💄 Beauty & Personal Care</SelectItem>
              <SelectItem value="sports" className="rounded-lg">⚽ Sports & Outdoors</SelectItem>
              <SelectItem value="books" className="rounded-lg">📚 Books & Media</SelectItem>
              <SelectItem value="toys" className="rounded-lg">🧸 Toys & Games</SelectItem>
              <SelectItem value="automotive" className="rounded-lg">🚗 Automotive</SelectItem>
              <SelectItem value="health" className="rounded-lg">🏥 Health & Wellness</SelectItem>
              <SelectItem value="food" className="rounded-lg">🍕 Food & Beverages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 group">
        <Label htmlFor="storeDescription" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-orange-600" />
          </div>
          Store Description <span className="text-red-500 text-lg">*</span>
        </Label>
        <Textarea
          id="storeDescription"
          value={formData.storeSetup.storeDescription}
          onChange={(e) => handleInputChange('storeDescription', e.target.value)}
          placeholder="Describe what you sell and what makes your store unique..."
          rows={4}
          className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl text-base group-hover:border-gray-300 resize-none"
        />
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
          ✨ Tell customers what makes your store special (max 500 characters)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label htmlFor="storeLogo" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
              <Image className="w-4 h-4 text-pink-600" />
            </div>
            Store Logo <span className="text-red-500 text-lg">*</span>
          </Label>
          <div className="border-3 border-dashed border-[#A8DADC]/50 rounded-2xl p-8 text-center bg-gradient-to-br from-[#A8DADC]/5 to-[#A8DADC]/10 hover:from-[#A8DADC]/10 hover:to-[#A8DADC]/15 transition-all duration-300 group cursor-pointer">
            <input
              type="file"
              id="storeLogo"
              accept="image/*"
              onChange={(e) => handleFileChange('storeLogo', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="storeLogo" className="cursor-pointer block">
              <div className="text-[#00dcaa] mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">Click to upload logo</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
              <p className="text-xs text-gray-400 mt-2">Recommended: 400x400 pixels</p>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="storeBanner" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center">
              <Image className="w-4 h-4 text-violet-600" />
            </div>
            Store Banner (Optional)
          </Label>
          <div className="border-3 border-dashed border-[#CDB4DB]/50 rounded-2xl p-8 text-center bg-gradient-to-br from-[#CDB4DB]/5 to-[#CDB4DB]/10 hover:from-[#CDB4DB]/10 hover:to-[#CDB4DB]/15 transition-all duration-300 group cursor-pointer">
            <input
              type="file"
              id="storeBanner"
              accept="image/*"
              onChange={(e) => handleFileChange('storeBanner', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="storeBanner" className="cursor-pointer block">
              <div className="text-[#00dcaa] mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">Click to upload banner</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
              <p className="text-xs text-gray-400 mt-2">Recommended: 1200x400 pixels</p>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          Pro Tips for Success
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span>Choose a memorable store name that reflects your brand identity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span>Write a compelling description that highlights your unique value proposition</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span>Use high-quality images for your logo and banner to build trust</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-between pt-8">
        <Button 
          onClick={prevStep}
          variant="outline"
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button 
          onClick={nextStep}
          className="bg-gradient-to-r from-[#00dcaa] to-[#00dcaa]/90 hover:from-[#00dcaa]/90 hover:to-[#00dcaa]/80 text-white px-10 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StoreSetupStep;