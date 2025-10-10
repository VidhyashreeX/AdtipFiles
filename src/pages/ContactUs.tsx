
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ContactUs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailSupport = () => {
    window.location.href = "mailto:support@adtip.in";
  };

  return (
    <div className="pb-20 md:pb-0 bg-white dark:bg-background min-h-screen">

      <div className="max-w-md mx-auto p-4">
        {/* Hero section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">We're here to help</h2>
          <p className="text-muted-foreground">
            Get in touch with our support team through any of these channels
          </p>
        </div>

        {/* Contact Options */}
        <div className="space-y-4">
          {/* Call Us */}

          {/* Email Us */}
          <div className="bg-card dark:bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground">Email Us</h3>
                <p className="text-sm text-muted-foreground">Send us your questions</p>
              </div>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              onClick={handleEmailSupport}
            >
              Email support@adtip.in
            </Button>
          </div>

          {/* Business Hours */}
          <div className="bg-muted dark:bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="font-medium text-foreground">Business Hours</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-8">Monday to Friday: 9 AM - 6 PM IST</p>
            <p className="text-sm text-muted-foreground ml-8">Saturday: 10 AM - 2 PM IST</p>
            <p className="text-sm text-muted-foreground ml-8">Sunday: Closed</p>
          </div>
          
          {/* Location */}
          <div className="bg-muted dark:bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <MapPin className="h-5 w-5 text-muted-foreground mr-3" />
              <h3 className="font-medium text-foreground">Office Address</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              AdTip Headquarters<br/>
              Vishakapatnam, Andhra Pradesh 531002<br/>
              India
            </p>
          </div>
        </div>
        
        {/* FAQs Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Looking for quick answers?</p>
          <Button 
            variant="outline" 
            className="text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20"
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
