import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Truck, Clock, RotateCcw, Package, MapPin, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import { FormData } from '../SellerRegistration';

interface ShippingPoliciesStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const ShippingPoliciesStep: React.FC<ShippingPoliciesStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const handleInputChange = (field: string, value: string | boolean) => {
    updateFormData('shippingPolicies', { [field]: value });
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const currentRegions = formData.shippingPolicies.shippingRegions;
    if (checked) {
      updateFormData('shippingPolicies', { 
        shippingRegions: [...currentRegions, region] 
      });
    } else {
      updateFormData('shippingPolicies', { 
        shippingRegions: currentRegions.filter(r => r !== region) 
      });
    }
  };

  const regions = [
    'United States', 'Canada', 'Mexico', 'United Kingdom', 'European Union', 
    'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 
    'India', 'China', 'Brazil', 'Argentina', 'South Africa', 'Worldwide'
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-800">Comprehensive Shipping & Policies Setup</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Configure detailed shipping options, return policies, and customer service standards to build trust and serve customers effectively across different regions.
        </p>
      </div>

      {/* Shipping Regions */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          Shipping Coverage
        </h4>
        <div className="space-y-4">
          <Label className="text-gray-700 font-medium text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            Shipping Regions Supported <span className="text-red-500">*</span>
          </Label>
          <p className="text-gray-600 text-sm">Select all regions where you can ship your products</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {regions.map((region) => (
              <div key={region} className="flex items-center space-x-2 bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 transition-colors">
                <Checkbox
                  id={region}
                  checked={formData.shippingPolicies.shippingRegions.includes(region)}
                  onCheckedChange={(checked) => handleRegionChange(region, checked as boolean)}
                  className="border-gray-300"
                />
                <Label htmlFor={region} className="text-sm text-gray-700 cursor-pointer font-medium">
                  {region}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping Options and Pricing */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-600" />
          Shipping Options & Pricing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Primary Shipping Method <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('shippingOptions', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select shipping pricing model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat-rate">Flat Rate Shipping</SelectItem>
                <SelectItem value="free-shipping">Free Shipping (Built into price)</SelectItem>
                <SelectItem value="weight-based">Weight-Based Pricing</SelectItem>
                <SelectItem value="calculated">Calculated Real-time Rates</SelectItem>
                <SelectItem value="zone-based">Zone-Based Pricing</SelectItem>
                <SelectItem value="local-pickup">Local Pickup Only</SelectItem>
                <SelectItem value="hybrid">Multiple Options Available</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="freeShippingThreshold" className="text-gray-700 font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Free Shipping Threshold
            </Label>
            <Input
              id="freeShippingThreshold"
              value={formData.shippingPolicies.freeShippingThreshold}
              onChange={(e) => handleInputChange('freeShippingThreshold', e.target.value)}
              placeholder="e.g., $50, $100"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
            <p className="text-sm text-gray-500">Order amount for free shipping (leave blank if not applicable)</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="deliveryTime" className="text-gray-700 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Standard Delivery Time <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('deliveryTime', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select delivery timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="same-day">Same Day (Local only)</SelectItem>
                <SelectItem value="1-2-days">1-2 Business Days</SelectItem>
                <SelectItem value="3-5-days">3-5 Business Days</SelectItem>
                <SelectItem value="5-7-days">5-7 Business Days</SelectItem>
                <SelectItem value="1-2-weeks">1-2 Weeks</SelectItem>
                <SelectItem value="2-4-weeks">2-4 Weeks</SelectItem>
                <SelectItem value="4-6-weeks">4-6 Weeks (International)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Packaging Type <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('packagingType', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select packaging approach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Packaging</SelectItem>
                <SelectItem value="eco-friendly">Eco-Friendly Materials</SelectItem>
                <SelectItem value="premium">Premium Gift Packaging</SelectItem>
                <SelectItem value="protective">Extra Protective Packaging</SelectItem>
                <SelectItem value="minimal">Minimal Packaging</SelectItem>
                <SelectItem value="custom">Custom Branded Packaging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-3 bg-white rounded-lg p-4 border border-gray-200">
          <Checkbox
            id="internationalShipping"
            checked={formData.shippingPolicies.internationalShipping}
            onCheckedChange={(checked) => handleInputChange('internationalShipping', checked as boolean)}
          />
          <div className="flex-1">
            <Label htmlFor="internationalShipping" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Offer International Shipping
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Check this if you're willing to ship internationally (additional customs forms may be required)
            </p>
          </div>
        </div>
      </div>

      {/* Return and Exchange Policies */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-orange-600" />
          Return & Exchange Policies
        </h4>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="returnPolicy" className="text-gray-700 font-medium flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-gray-500" />
              Detailed Return Policy <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="returnPolicy"
              value={formData.shippingPolicies.returnPolicy}
              onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
              placeholder="Describe your return policy including timeframe, condition requirements, who pays return shipping, refund process, and any exceptions..."
              rows={6}
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Return Window</Label>
                <Select onValueChange={(value) => handleInputChange('returnWindow', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7-days">7 Days</SelectItem>
                    <SelectItem value="14-days">14 Days</SelectItem>
                    <SelectItem value="30-days">30 Days</SelectItem>
                    <SelectItem value="60-days">60 Days</SelectItem>
                    <SelectItem value="90-days">90 Days</SelectItem>
                    <SelectItem value="no-returns">No Returns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Return Shipping</Label>
                <Select onValueChange={(value) => handleInputChange('returnShipping', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa]">
                    <SelectValue placeholder="Who pays?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer-pays">Buyer Pays</SelectItem>
                    <SelectItem value="seller-pays">Seller Pays</SelectItem>
                    <SelectItem value="depends">Case by Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Refund Method</Label>
                <Select onValueChange={(value) => handleInputChange('refundMethod', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa]">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original-payment">Original Payment Method</SelectItem>
                    <SelectItem value="store-credit">Store Credit Only</SelectItem>
                    <SelectItem value="exchange-only">Exchange Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Service */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-600" />
          Customer Service Standards
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Customer Service Hours <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('customerServiceHours', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select service hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24-7">24/7 Support</SelectItem>
                <SelectItem value="business-hours">Business Hours (9 AM - 5 PM)</SelectItem>
                <SelectItem value="extended-hours">Extended Hours (8 AM - 8 PM)</SelectItem>
                <SelectItem value="weekdays-only">Weekdays Only</SelectItem>
                <SelectItem value="limited-hours">Limited Hours</SelectItem>
                <SelectItem value="email-only">Email Support Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Response Time Commitment
            </Label>
            <Select onValueChange={(value) => handleInputChange('responseTime', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select response time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Within 1 Hour</SelectItem>
                <SelectItem value="same-day">Same Day</SelectItem>
                <SelectItem value="24-hours">Within 24 Hours</SelectItem>
                <SelectItem value="48-hours">Within 48 Hours</SelectItem>
                <SelectItem value="3-days">Within 3 Business Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Enhanced Shipping Tips */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-800">Pro Shipping & Customer Service Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-gray-800 mb-2">Shipping Best Practices</h5>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Offer multiple shipping speeds to cater to different customer needs</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Free shipping increases conversion rates, even with higher product prices</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>International shipping opens up larger markets for your products</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Accurate delivery estimates build customer trust and reduce complaints</span>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-800 mb-2">Return Policy Guidelines</h5>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Clear return policies reduce customer hesitation and increase sales</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Generous return windows can increase customer confidence</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Fast response times improve customer satisfaction ratings</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00dcaa] mr-2">•</span>
                <span>Consider offering exchanges before refunds to retain sales</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button 
          onClick={prevStep}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2 rounded-lg font-medium"
        >
          Previous
        </Button>
        <Button 
          onClick={nextStep}
          className="bg-[#00dcaa] hover:bg-[#00dcaa]/90 text-white px-8 py-2 rounded-lg font-medium transition-colors"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};

export default ShippingPoliciesStep;