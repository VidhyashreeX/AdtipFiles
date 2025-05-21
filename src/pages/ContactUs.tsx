
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ContactUs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCallSupport = () => {
    window.location.href = "tel:+918148147172";
  };

  const handleEmailSupport = () => {
    window.location.href = "mailto:support@adtip.in";
  };

  return (
    <div className="pb-20 md:pb-0 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <button onClick={() => navigate(-1)} className="flex items-center">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-center flex-1">Contact Us</h1>
        <div className="w-6"></div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Hero section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">We're here to help</h2>
          <p className="text-gray-600">
            Get in touch with our support team through any of these channels
          </p>
        </div>

        {/* Contact Options */}
        <div className="space-y-4">
          {/* Call Us */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="bg-teal-100 p-3 rounded-full mr-3">
                <Phone className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Call Support</h3>
                <p className="text-sm text-gray-600">Speak directly with our team</p>
              </div>
            </div>
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleCallSupport}
            >
              Call +91 8148147172
            </Button>
          </div>

          {/* Email Us */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 p-3 rounded-full mr-3">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Email Us</h3>
                <p className="text-sm text-gray-600">Send us your questions</p>
              </div>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleEmailSupport}
            >
              Email support@adtip.in
            </Button>
          </div>

          {/* Business Hours */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-gray-600 mr-3" />
              <h3 className="font-medium text-gray-800">Business Hours</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8">Monday to Friday: 9 AM - 6 PM IST</p>
            <p className="text-sm text-gray-600 ml-8">Saturday: 10 AM - 2 PM IST</p>
            <p className="text-sm text-gray-600 ml-8">Sunday: Closed</p>
          </div>
          
          {/* Location */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <MapPin className="h-5 w-5 text-gray-600 mr-3" />
              <h3 className="font-medium text-gray-800">Office Address</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              AdTip Headquarters<br/>
              Vishakapatnam, Andhra Pradesh 531002<br/>
              India
            </p>
          </div>
        </div>
        
        {/* FAQs Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Looking for quick answers?</p>
          <Button 
            variant="outline" 
            className="text-teal-600 border-teal-300"
            onClick={() => navigate("/how-to-earn-user")}
          >
            Check our FAQs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
