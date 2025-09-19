import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, DollarSign, Building, Shield, AlertTriangle, FileText, Calculator, Globe } from 'lucide-react';
import { FormData } from '../SellerRegistration';

interface PaymentInfoStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const PaymentInfoStep: React.FC<PaymentInfoStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const handleInputChange = (field: string, value: string | boolean) => {
    updateFormData('paymentInfo', { [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-800">Payment & Tax Information Setup</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Configure your payment methods, banking details, and tax information to receive payments from sales and ensure compliance with tax regulations.
        </p>
      </div>

      {/* Primary Banking Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Primary Banking Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="bankName" className="text-gray-700 font-medium">
              Bank Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankName"
              value={formData.paymentInfo.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="Enter your bank name"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="accountHolder" className="text-gray-700 font-medium">
              Account Holder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountHolder"
              value={formData.paymentInfo.accountHolder}
              onChange={(e) => handleInputChange('accountHolder', e.target.value)}
              placeholder="Full name on bank account"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="bankAccount" className="text-gray-700 font-medium">
              Bank Account Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankAccount"
              value={formData.paymentInfo.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              placeholder="Enter account number"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="routingNumber" className="text-gray-700 font-medium">
              Routing Number (US) / Sort Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="routingNumber"
              value={formData.paymentInfo.routingNumber}
              onChange={(e) => handleInputChange('routingNumber', e.target.value)}
              placeholder="9-digit routing number"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="swiftCode" className="text-gray-700 font-medium">
              SWIFT/BIC Code (International)
            </Label>
            <Input
              id="swiftCode"
              value={formData.paymentInfo.swiftCode}
              onChange={(e) => handleInputChange('swiftCode', e.target.value)}
              placeholder="For international transfers"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Account Type <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('accountType', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking Account</SelectItem>
                <SelectItem value="savings">Savings Account</SelectItem>
                <SelectItem value="business">Business Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Payment Method Preferences */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          Payment Method Preferences
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Preferred Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('paymentMethod', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank-transfer">Direct Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="wire-transfer">Wire Transfer</SelectItem>
                <SelectItem value="check">Paper Check</SelectItem>
                <SelectItem value="digital-wallet">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Payment Frequency <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('paymentFrequency', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="on-demand">On Demand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="minimumPayout" className="text-gray-700 font-medium">
              Minimum Payout Threshold
            </Label>
            <Input
              id="minimumPayout"
              value={formData.paymentInfo.minimumPayout}
              onChange={(e) => handleInputChange('minimumPayout', e.target.value)}
              placeholder="e.g., $100"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
            <p className="text-sm text-gray-500">Minimum amount before payout is processed</p>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Currency Preference
            </Label>
            <Select onValueChange={(value) => handleInputChange('currency', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-yellow-600" />
          Tax Information & Compliance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="taxIdNumber" className="text-gray-700 font-medium">
              Tax ID Number (EIN/SSN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="taxIdNumber"
              value={formData.paymentInfo.taxIdNumber}
              onChange={(e) => handleInputChange('taxIdNumber', e.target.value)}
              placeholder="Enter tax ID number"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Tax Classification <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => handleInputChange('taxClassification', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
                <SelectItem value="single-llc">Single Member LLC</SelectItem>
                <SelectItem value="multi-llc">Multi Member LLC</SelectItem>
                <SelectItem value="c-corp">C Corporation</SelectItem>
                <SelectItem value="s-corp">S Corporation</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="non-profit">Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="vatNumber" className="text-gray-700 font-medium">
              VAT Number (EU/International)
            </Label>
            <Input
              id="vatNumber"
              value={formData.paymentInfo.vatNumber}
              onChange={(e) => handleInputChange('vatNumber', e.target.value)}
              placeholder="Enter VAT number if applicable"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">
              Sales Tax Registration
            </Label>
            <Select onValueChange={(value) => handleInputChange('salesTaxRegistration', value)}>
              <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] h-12">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Registered for Sales Tax</SelectItem>
                <SelectItem value="not-registered">Not Registered</SelectItem>
                <SelectItem value="exempt">Tax Exempt</SelectItem>
                <SelectItem value="pending">Registration Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="w9Completed"
                checked={formData.paymentInfo.w9Completed}
                onCheckedChange={(checked) => handleInputChange('w9Completed', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="w9Completed" className="text-gray-700 font-medium cursor-pointer">
                  I will provide completed W-9 form (US Sellers)
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Required for US tax reporting and 1099 generation
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="taxCompliance"
                checked={formData.paymentInfo.taxCompliance}
                onCheckedChange={(checked) => handleInputChange('taxCompliance', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="taxCompliance" className="text-gray-700 font-medium cursor-pointer">
                  I understand my tax obligations as a seller
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Including income reporting, sales tax collection where applicable, and record keeping requirements
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Payment Settings */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-600" />
          Additional Payment Settings
        </h4>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="holdPayments"
                checked={formData.paymentInfo.holdPayments}
                onCheckedChange={(checked) => handleInputChange('holdPayments', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="holdPayments" className="text-gray-700 font-medium cursor-pointer">
                  Hold payments until order delivery confirmation
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Recommended for new sellers to reduce chargeback risk
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="automaticTax"
                checked={formData.paymentInfo.automaticTax}
                onCheckedChange={(checked) => handleInputChange('automaticTax', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="automaticTax" className="text-gray-700 font-medium cursor-pointer">
                  Enable automatic tax calculation
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically calculate and collect sales tax based on customer location
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="specialInstructions" className="text-gray-700 font-medium">
              Special Payment Instructions
            </Label>
            <Textarea
              id="specialInstructions"
              value={formData.paymentInfo.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              placeholder="Any special instructions for payments, banking, or tax handling..."
              rows={3}
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-100">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-red-600 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Security & Privacy Notice</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• All financial information is encrypted and stored securely</li>
              <li>• We comply with PCI DSS standards for payment processing</li>
              <li>• Your banking details are never shared with third parties</li>
              <li>• You can update payment information anytime from your dashboard</li>
              <li>• Two-factor authentication is recommended for account security</li>
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

export default PaymentInfoStep;