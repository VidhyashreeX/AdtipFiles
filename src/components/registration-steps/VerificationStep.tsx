import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, FileText, IdCard, Phone, Mail, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { FormData } from '../SellerRegistration';

interface VerificationStepProps {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const VerificationStep: React.FC<VerificationStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [phoneCode, setPhoneCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleFileChange = (field: string, file: File | null) => {
    updateFormData('verification', { [field]: file });
  };

  const sendPhoneOTP = () => {
    setPhoneSent(true);
    console.log('Phone OTP sent');
  };

  const sendEmailOTP = () => {
    setEmailSent(true);
    console.log('Email OTP sent');
  };

  const verifyPhone = () => {
    if (phoneCode === '123456') {
      updateFormData('verification', { phoneVerified: true });
    }
  };

  const verifyEmail = () => {
    if (emailCode === '123456') {
      updateFormData('verification', { emailVerified: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-800">Document & Identity Verification</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Upload the required documents to verify your identity and business. This helps ensure marketplace security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="businessLicense" className="text-gray-700 font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Business License / Certificate
          </Label>
          <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 text-center bg-amber-50 hover:bg-amber-100 transition-colors">
            <input
              type="file"
              id="businessLicense"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange('businessLicense', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="businessLicense" className="cursor-pointer">
              <div className="text-amber-600 mb-2">
                <Upload className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-gray-600">Upload business license</p>
              <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
            </label>
          </div>
          {formData.verification.businessLicense && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              File uploaded
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="identityProof" className="text-gray-700 font-medium flex items-center gap-2">
            <IdCard className="w-4 h-4 text-gray-500" />
            Identity Proof <span className="text-red-500">*</span>
          </Label>
          <div className="border-2 border-dashed border-cyan-200 rounded-lg p-6 text-center bg-cyan-50 hover:bg-cyan-100 transition-colors">
            <input
              type="file"
              id="identityProof"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange('identityProof', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="identityProof" className="cursor-pointer">
              <div className="text-cyan-600 mb-2">
                <Upload className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-gray-600">Upload ID document</p>
              <p className="text-sm text-gray-500 mt-1">Passport, Driver's License, etc.</p>
            </label>
          </div>
          {formData.verification.identityProof && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              File uploaded
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            Phone Number Verification <span className="text-red-500">*</span>
          </Label>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            {!phoneSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-gray-600 mb-3">Verify: {formData.personalInfo.phone}</p>
                <Button onClick={sendPhoneOTP} className="bg-[#00dcaa] hover:bg-[#00dcaa]/90 text-white">
                  Send SMS Code
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.verification.phoneVerified ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-green-600">Phone number verified</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00dcaa] focus:ring-[#00dcaa]"
                    />
                    <Button onClick={verifyPhone} className="w-full bg-[#00dcaa] hover:bg-[#00dcaa]/90 text-white">
                      Verify Phone
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                      <AlertCircle className="w-3 h-3" />
                      Use code: 123456 for demo
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            Email Verification <span className="text-red-500">*</span>
          </Label>
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
            {!emailSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-pink-600" />
                </div>
                <p className="text-gray-600 mb-3">Verify: {formData.personalInfo.email}</p>
                <Button onClick={sendEmailOTP} className="bg-[#00dcaa] hover:bg-[#00dcaa]/90 text-white">
                  Send Email Code
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.verification.emailVerified ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-green-600">Email address verified</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00dcaa] focus:ring-[#00dcaa]"
                    />
                    <Button onClick={verifyEmail} className="w-full bg-[#00dcaa] hover:bg-[#00dcaa]/90 text-white">
                      Verify Email
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                      <AlertCircle className="w-3 h-3" />
                      Use code: 123456 for demo
                    </div>
                  </>
                )}
              </div>
            )}
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

export default VerificationStep;