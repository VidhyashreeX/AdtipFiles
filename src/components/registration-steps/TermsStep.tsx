import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormData } from '../SellerRegistration';
import { Shield, FileText, Mail, AlertTriangle } from 'lucide-react';

interface TermsStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TermsStep: React.FC<TermsStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const handleCheckboxChange = (field: string, checked: boolean) => {
    updateFormData('terms', { [field]: checked });
  };

  const canProceed = formData.terms.sellerAgreement && formData.terms.privacyPolicy && formData.terms.dataProcessing;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#CDB4DB]/20 to-[#FFB4B4]/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-[#00dcaa]" />
          <h3 className="font-medium text-gray-800">Terms & Agreements</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Please review and accept our terms to complete your seller registration.
        </p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:border-[#00dcaa]/30 transition-colors">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="sellerAgreement"
              checked={formData.terms.sellerAgreement}
              onCheckedChange={(checked) => handleCheckboxChange('sellerAgreement', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="sellerAgreement" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                I accept the Seller Agreement <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                This includes commission rates, payment terms, and seller responsibilities.
              </p>
              <a href="#" className="text-[#00dcaa] hover:underline text-sm font-medium mt-2 inline-block">
                Read Full Agreement →
              </a>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:border-[#00dcaa]/30 transition-colors">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacyPolicy"
              checked={formData.terms.privacyPolicy}
              onCheckedChange={(checked) => handleCheckboxChange('privacyPolicy', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="privacyPolicy" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                I agree to the Privacy Policy <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                How we collect, use, and protect your personal and business information.
              </p>
              <a href="#" className="text-[#00dcaa] hover:underline text-sm font-medium mt-2 inline-block">
                Read Privacy Policy →
              </a>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:border-[#00dcaa]/30 transition-colors">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="dataProcessing"
              checked={formData.terms.dataProcessing}
              onCheckedChange={(checked) => handleCheckboxChange('dataProcessing', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="dataProcessing" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                I consent to Data Processing <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Processing of business data for platform operations and compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-[#00dcaa]/30 transition-colors">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="newsletter"
                checked={formData.terms.newsletter}
                onCheckedChange={(checked) => handleCheckboxChange('newsletter', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="newsletter" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00dcaa]" />
                  Seller Newsletter
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Monthly updates and seller tips (optional).
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-[#00dcaa]/30 transition-colors">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketingEmails"
                checked={formData.terms.marketingEmails}
                onCheckedChange={(checked) => handleCheckboxChange('marketingEmails', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="marketingEmails" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600" />
                  Promotional Emails
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Promotional offers, product recommendations, and special deals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              By proceeding, you agree to comply with all marketplace rules and regulations. 
              Violation of terms may result in account suspension or termination.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="text-sm font-medium text-green-800 mb-2">What happens next?</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>• Account creation and welcome email</p>
          <p>• Document verification (24-48 hours)</p>
          <p>• Access to seller dashboard and tools</p>
          <p>• Start listing your products</p>
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
          disabled={!canProceed}
          className={`px-8 py-2 rounded-lg font-medium transition-colors ${
            canProceed 
              ? 'bg-[#00dcaa] hover:bg-[#00dcaa]/90 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Complete Registration
        </Button>
      </div>
    </div>
  );
};

export default TermsStep;