import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import PersonalInfoStep from './registration-steps/PersonalInfoStep';
import StoreSetupStep from './registration-steps/StoreSetupStep';
import AccountCredentialsStep from './registration-steps/AccountCredentialsStep';
import PaymentInfoStep from './registration-steps/PaymentInfoStep';
import ShippingPoliciesStep from './registration-steps/ShippingPoliciesStep';
import VerificationStep from './registration-steps/VerificationStep';
import TermsStep from './registration-steps/TermsStep';
import SuccessStep from './registration-steps/SuccessStep';

const STEPS = [
  { id: 1, title: 'Personal & Business Info', component: PersonalInfoStep },
  { id: 2, title: 'Store Setup', component: StoreSetupStep },
  { id: 3, title: 'Account Credentials', component: AccountCredentialsStep },
  { id: 4, title: 'Payment & Tax Info', component: PaymentInfoStep },
  { id: 5, title: 'Shipping & Policies', component: ShippingPoliciesStep },
  { id: 6, title: 'Verification', component: VerificationStep },
  { id: 7, title: 'Terms & Agreements', component: TermsStep },
  { id: 8, title: 'Success', component: SuccessStep },
];

export interface FormData {
  personalInfo: {
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    address: string;
    businessType: string;
    taxId: string;
    website: string;
    businessRegistrationNumber: string;
    yearEstablished: string;
    employeeCount: string;
    businessDescription: string;
  };
  storeSetup: {
    storeName: string;
    storeDescription: string;
    storeCategory: string;
    storeLogo: File | null;
    storeBanner: File | null;
    returnPolicy: string;
    customerServiceHours: string;
    socialMediaLinks: {
      facebook: string;
      instagram: string;
      twitter: string;
    };
  };
  accountCredentials: {
    username: string;
    password: string;
    confirmPassword: string;
    securityQuestion: string;
    securityAnswer: string;
    twoFactorAuth: boolean;
  };
  paymentInfo: {
    bankAccount: string;
    bankName: string;
    accountHolder: string;
    taxIdNumber: string;
    paymentMethod: string;
    swiftCode: string;
    routingNumber: string;
    paymentFrequency: string;
    accountType: string;
    minimumPayout: string;
    currency: string;
    taxClassification: string;
    vatNumber: string;
    salesTaxRegistration: string;
    w9Completed: boolean;
    taxCompliance: boolean;
    holdPayments: boolean;
    automaticTax: boolean;
    specialInstructions: string;
  };
  shippingPolicies: {
    shippingRegions: string[];
    shippingOptions: string;
    returnPolicy: string;
    deliveryTime: string;
    packagingType: string;
    internationalShipping: boolean;
    freeShippingThreshold: string;
    returnWindow: string;
    returnShipping: string;
    refundMethod: string;
    customerServiceHours: string;
    responseTime: string;
  };
  verification: {
    businessLicense: File | null;
    identityProof: File | null;
    phoneVerified: boolean;
    emailVerified: boolean;
    addressProof: File | null;
    taxCertificate: File | null;
  };
  terms: {
    sellerAgreement: boolean;
    privacyPolicy: boolean;
    newsletter: boolean;
    marketingEmails: boolean;
    dataProcessing: boolean;
  };
}

const SellerRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      fullName: '',
      businessName: '',
      email: '',
      phone: '',
      address: '',
      businessType: '',
      taxId: '',
      website: '',
      businessRegistrationNumber: '',
      yearEstablished: '',
      employeeCount: '',
      businessDescription: '',
    },
    storeSetup: {
      storeName: '',
      storeDescription: '',
      storeCategory: '',
      storeLogo: null,
      storeBanner: null,
      returnPolicy: '',
      customerServiceHours: '',
      socialMediaLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
      },
    },
    accountCredentials: {
      username: '',
      password: '',
      confirmPassword: '',
      securityQuestion: '',
      securityAnswer: '',
      twoFactorAuth: false,
    },
    paymentInfo: {
      bankAccount: '',
      bankName: '',
      accountHolder: '',
      taxIdNumber: '',
      paymentMethod: '',
      swiftCode: '',
      routingNumber: '',
      paymentFrequency: '',
      accountType: '',
      minimumPayout: '',
      currency: '',
      taxClassification: '',
      vatNumber: '',
      salesTaxRegistration: '',
      w9Completed: false,
      taxCompliance: false,
      holdPayments: false,
      automaticTax: false,
      specialInstructions: '',
    },
    shippingPolicies: {
      shippingRegions: [],
      shippingOptions: '',
      returnPolicy: '',
      deliveryTime: '',
      packagingType: '',
      internationalShipping: false,
      freeShippingThreshold: '',
      returnWindow: '',
      returnShipping: '',
      refundMethod: '',
      customerServiceHours: '',
      responseTime: '',
    },
    verification: {
      businessLicense: null,
      identityProof: null,
      phoneVerified: false,
      emailVerified: false,
      addressProof: null,
      taxCertificate: null,
    },
    terms: {
      sellerAgreement: false,
      privacyPolicy: false,
      newsletter: false,
      marketingEmails: false,
      dataProcessing: false,
    },
  });

  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Static Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/10 via-[#A8DADC]/15 to-[#CDB4DB]/10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#00dcaa]/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-[#F4A261]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-[#CDB4DB]/10 rounded-full blur-xl"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#00dcaa] to-[#00dcaa]/80 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                <path fillRule="evenodd" d="M3 8h14l-1 9a2 2 0 01-2 2H6a2 2 0 110 2H9a2 2 0 01-2-2L3 8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
            Become a Seller
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Join our marketplace and start selling your products to customers worldwide
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00dcaa] rounded-full"></div>
              <span>Quick Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#F4A261] rounded-full"></div>
              <span>Secure Process</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#CDB4DB] rounded-full"></div>
              <span>Expert Support</span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 px-4">
            {STEPS.slice(0, -1).map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full font-semibold text-sm transition-all duration-500 ${
                  currentStep > step.id 
                    ? 'bg-[#00dcaa] text-white shadow-lg' 
                    : currentStep === step.id 
                    ? 'bg-[#00dcaa] text-white shadow-lg' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                {index < STEPS.length - 2 && (
                  <div className={`w-16 h-1 mx-3 rounded-full transition-all duration-500 ${
                    currentStep > step.id ? 'bg-[#00dcaa] shadow-sm' : 'bg-gray-200'
                  }`}>
                    {currentStep > step.id && (
                      <div className="w-full h-full bg-gradient-to-r from-[#00dcaa] to-[#00dcaa]/80 rounded-full"></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#00dcaa]/20 to-[#00dcaa]/5 rounded-full"></div>
          </div>
          <div className="flex justify-between mt-3 px-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {STEPS.length - 1}</span>
            <span className="text-sm font-medium text-[#00dcaa]">{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <div>
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#00dcaa] via-[#00dcaa]/90 to-[#00dcaa]/80 text-white rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <CardTitle className="text-2xl font-bold relative z-10 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">{currentStep}</span>
                </div>
                {STEPS[currentStep - 1]?.title}
              </CardTitle>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            </CardHeader>
            <CardContent className="p-8 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00dcaa]/20 via-[#F4A261]/20 to-[#CDB4DB]/20"></div>
              {CurrentStepComponent && (
                <CurrentStepComponent
                  formData={formData}
                  updateFormData={updateFormData}
                  nextStep={nextStep}
                  {...(currentStep > 1 ? { prevStep } : {})}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;