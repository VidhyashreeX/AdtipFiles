
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen p-6 pb-20 bg-white">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-500 flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Data Collection & Usage</h2>
            <p className="text-gray-700">
              We collect user data, including personal details and browsing activity, to improve platform functionality.
              Data is never shared with third parties without user consent, except where required by law.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Content Monitoring</h2>
            <p className="text-gray-700">
              Content is monitored for copyright violations, which may result in removal within 14 business days.
              Users may report inappropriate content, and AdTip will take appropriate action as per legal guidelines.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Payments & Transactions</h2>
            <p className="text-gray-700">
              Payments to creators are subject to verification and integrity checks.
              AdTip does not guarantee payment processing timeframes but aims to process verified transactions within 30 business days.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Security Measures</h2>
            <p className="text-gray-700">
              We implement encryption and security protocols to protect user data.
              Users are responsible for safeguarding their login credentials and personal data.
              AdTip is not liable for data breaches beyond our reasonable control.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Third-Party Links & Services</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites. AdTip is not responsible for the privacy practices or content of these external services.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. International Data Transfers</h2>
            <p className="text-gray-700">
              If you are accessing AdTip from outside India, your information may be transferred to, stored, and processed in India or other countries where our servers are located.
              By using AdTip, you consent to the transfer of your data to countries outside your own, which may have different data protection laws than your jurisdiction.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Payment Data & Third-Party Processors</h2>
            <p className="text-gray-700">
              Payment information, such as credit/debit card numbers and billing addresses, is processed securely by third-party payment gateways (e.g., Stripe, Razorpay, PayPal).
              AdTip does not store full card details on its servers.
              Users acknowledge that third-party processors have their own privacy and compliance policies, and agree to review and accept those terms when transacting.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Policy Updates & Acceptance</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. Continued use of AdTip implies acceptance of any modifications.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact & Support</h2>
            <p className="text-gray-700">
              For any concerns regarding these policies, please contact:
              <a href="mailto:support@adtip.in" className="text-adtip-teal"> support@adtip.in</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
