import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Building, Mail, Phone, MapPin, FileText, CreditCard, Sparkles, Calendar, Users, Globe } from 'lucide-react';
import { FormData } from '../SellerRegistration';

interface PersonalInfoStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, updateFormData, nextStep }) => {
  const handleInputChange = (field: string, value: string) => {
    updateFormData('personalInfo', { [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-xl p-8 border border-rose-100 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center shadow-md">
            <User className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Personal & Business Information
              <Sparkles className="w-5 h-5 text-rose-500" />
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Provide comprehensive details to help us verify your identity and set up your business profile.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Personal Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 group">
            <Label htmlFor="fullName" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              Full Legal Name <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.personalInfo.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full legal name"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              Email Address <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="phone" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-orange-600" />
              </div>
              Phone Number <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.personalInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="address" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-teal-600" />
              </div>
              Personal Address <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="address"
              value={formData.personalInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Street, City, State, Country, Zip"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Business Information Section */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-purple-600" />
          Business Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 group">
            <Label htmlFor="businessName" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-purple-600" />
              </div>
              Legal Business Name <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="businessName"
              value={formData.personalInfo.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Enter legal business name"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-indigo-600" />
              </div>
              Business Type <span className="text-red-500 text-lg">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('businessType', value)}>
              <SelectTrigger className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="sole-proprietorship" className="rounded-lg">Sole Proprietorship</SelectItem>
                <SelectItem value="partnership" className="rounded-lg">Partnership</SelectItem>
                <SelectItem value="llc" className="rounded-lg">Limited Liability Company (LLC)</SelectItem>
                <SelectItem value="corporation" className="rounded-lg">Corporation</SelectItem>
                <SelectItem value="nonprofit" className="rounded-lg">Non-Profit Organization</SelectItem>
                <SelectItem value="other" className="rounded-lg">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="businessRegistrationNumber" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-yellow-600" />
              </div>
              Business Registration Number
            </Label>
            <Input
              id="businessRegistrationNumber"
              value={formData.personalInfo.businessRegistrationNumber}
              onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
              placeholder="Business registration/license number"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="taxId" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-red-600" />
              </div>
              Tax ID / EIN <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="taxId"
              value={formData.personalInfo.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              placeholder="Enter tax ID or EIN"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="yearEstablished" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              Year Established <span className="text-red-500 text-lg">*</span>
            </Label>
            <Input
              id="yearEstablished"
              type="number"
              value={formData.personalInfo.yearEstablished}
              onChange={(e) => handleInputChange('yearEstablished', e.target.value)}
              placeholder="2020"
              min="1900"
              max={new Date().getFullYear()}
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>

          <div className="space-y-3 group">
            <Label className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              Number of Employees <span className="text-red-500 text-lg">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('employeeCount', value)}>
              <SelectTrigger className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300">
                <SelectValue placeholder="Select employee count" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="1" className="rounded-lg">Just me (1)</SelectItem>
                <SelectItem value="2-5" className="rounded-lg">2-5 employees</SelectItem>
                <SelectItem value="6-10" className="rounded-lg">6-10 employees</SelectItem>
                <SelectItem value="11-25" className="rounded-lg">11-25 employees</SelectItem>
                <SelectItem value="26-50" className="rounded-lg">26-50 employees</SelectItem>
                <SelectItem value="51-100" className="rounded-lg">51-100 employees</SelectItem>
                <SelectItem value="100+" className="rounded-lg">100+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="website" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-violet-600" />
              </div>
              Business Website
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.personalInfo.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.yourwebsite.com"
              className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl h-12 text-base group-hover:border-gray-300"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3 group">
          <Label htmlFor="businessDescription" className="text-gray-700 font-semibold flex items-center gap-3 text-base">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            Business Description <span className="text-red-500 text-lg">*</span>
          </Label>
          <Textarea
            id="businessDescription"
            value={formData.personalInfo.businessDescription}
            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
            placeholder="Describe your business, what you sell, your target market, and what makes you unique..."
            rows={4}
            className="border-2 border-gray-200 focus:border-[#00dcaa] focus:ring-2 focus:ring-[#00dcaa]/20 transition-all duration-300 rounded-xl text-base group-hover:border-gray-300 resize-none"
          />
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
            📝 This helps us understand your business better and may be shown to potential customers
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          Why We Need This Information
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span><strong>Identity Verification:</strong> We verify all sellers to maintain marketplace trust and security</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span><strong>Tax Compliance:</strong> Required for generating proper tax documents and reporting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span><strong>Customer Trust:</strong> Verified business information helps customers feel confident in purchases</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00dcaa] mt-1">•</span>
            <span><strong>Legal Protection:</strong> Ensures compliance with local and international commerce laws</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-end pt-8">
        <Button 
          onClick={nextStep}
          className="bg-gradient-to-r from-[#00dcaa] to-[#00dcaa]/90 hover:from-[#00dcaa]/90 hover:to-[#00dcaa]/80 text-white px-10 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        >
          Continue to Store Setup
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;