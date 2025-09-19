import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FormData } from '../SellerRegistration';
import { Eye, EyeOff, Shield, HelpCircle, UserCheck } from 'lucide-react';

interface AccountCredentialsStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const AccountCredentialsStep: React.FC<AccountCredentialsStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    updateFormData('accountCredentials', { [field]: value });
    
    if (field === 'password' && typeof value === 'string') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    setPasswordStrength(Math.min(strength, 100));
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 30) return 'bg-red-500';
    if (passwordStrength <= 60) return 'bg-yellow-500';
    if (passwordStrength <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 30) return 'Weak';
    if (passwordStrength <= 60) return 'Fair';
    if (passwordStrength <= 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#A8DADC]/20 to-[#CDB4DB]/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck className="w-6 h-6 text-[#00dcaa]" />
          <h3 className="font-medium text-gray-800">Account Security & Access</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Create secure login credentials for your seller account. These will be used to access your dashboard and manage your store.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-700 font-medium">
            Store Username (Optional)
          </Label>
          <Input
            id="username"
            value={formData.accountCredentials.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="e.g., awesome-electronics-store"
            className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa]"
          />
          <p className="text-sm text-gray-500">
            This will be used for your store URL: marketplace.com/store/<strong>{formData.accountCredentials.username || 'your-username'}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.accountCredentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.accountCredentials.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Password Strength:</span>
                <span className={`text-sm font-medium ${
                  passwordStrength <= 30 ? 'text-red-500' :
                  passwordStrength <= 60 ? 'text-yellow-500' :
                  passwordStrength <= 80 ? 'text-blue-500' : 'text-green-500'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Use at least 8 characters with uppercase, lowercase, numbers, and special characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.accountCredentials.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.accountCredentials.confirmPassword && 
           formData.accountCredentials.password !== formData.accountCredentials.confirmPassword && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              Passwords do not match
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">
            Security Question <span className="text-red-500">*</span>
          </Label>
          <Select onValueChange={(value) => handleInputChange('securityQuestion', value)}>
            <SelectTrigger className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa]">
              <SelectValue placeholder="Choose a security question" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pet-name">What was the name of your first pet?</SelectItem>
              <SelectItem value="birth-city">In what city were you born?</SelectItem>
              <SelectItem value="school-name">What was the name of your elementary school?</SelectItem>
              <SelectItem value="mother-maiden">What is your mother's maiden name?</SelectItem>
              <SelectItem value="first-car">What was your first car?</SelectItem>
              <SelectItem value="best-friend">What was the name of your childhood best friend?</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityAnswer" className="text-gray-700 font-medium">
            Security Answer <span className="text-red-500">*</span>
          </Label>
          <Input
            id="securityAnswer"
            value={formData.accountCredentials.securityAnswer}
            onChange={(e) => handleInputChange('securityAnswer', e.target.value)}
            placeholder="Enter your security answer"
            className="border-gray-300 focus:border-[#00dcaa] focus:ring-[#00dcaa]"
          />
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="twoFactorAuth"
              checked={formData.accountCredentials.twoFactorAuth}
              onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="twoFactorAuth" className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Enable Two-Factor Authentication (2FA) - Recommended
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Add an extra layer of security to your account using SMS or authenticator app verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#F4A261]/20 to-[#FFB4B4]/20 rounded-lg p-6">
        <h3 className="font-medium text-gray-800 mb-4">Quick Sign-up Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button variant="outline" className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
          Using social login will pre-fill some of your information and speed up the registration process.
        </p>
      </div>

      <Accordion type="single" collapsible className="bg-gray-50 rounded-lg">
        <AccordionItem value="security-faq">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#00dcaa]" />
              <span className="font-medium text-gray-800">Account Security FAQ</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h5 className="font-medium text-gray-800 mb-1">How secure is my account information?</h5>
                <p>We use industry-standard encryption and security measures. Your password is hashed and never stored in plain text.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Can I change my username later?</h5>
                <p>Yes, you can change your store username once every 30 days from your seller dashboard.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">What happens if I forget my password?</h5>
                <p>You can reset your password using your email address and security question. 2FA users will need their authenticator.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Is two-factor authentication mandatory?</h5>
                <p>While not mandatory, we highly recommend enabling 2FA for enhanced security, especially for business accounts.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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

export default AccountCredentialsStep;