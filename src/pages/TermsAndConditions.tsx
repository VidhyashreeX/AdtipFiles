
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
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
        <h1 className="text-2xl font-bold text-center mb-8">Terms & Conditions</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to AdTip Co. By accessing or using our platform, you agree to abide by these Terms & Conditions. If you do not agree with any part of these terms, you should discontinue using the service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Account Registration & Eligibility</h2>
            <p className="text-gray-700">
              Users must be at least 13 years old or have parental consent to use AdTip.
              You are responsible for maintaining the confidentiality of your account credentials.
              Providing false or misleading information during registration may result in account suspension or termination.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Content & Copyright</h2>
            <p className="text-gray-700">
              Creators must ensure that their content does not infringe any third-party copyrights, trademarks, or intellectual property rights.
              AdTip Co. reserves the right to remove copyrighted material within 14 business days of receiving a valid complaint.
              Users grant AdTip a non-exclusive, worldwide license to use, modify, display, and distribute content uploaded on the platform.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Premium Earnings</h2>
            <p className="text-gray-700">
              Earnings are subject to verification and platform integrity checks; no guarantees are provided.
              Fraudulent activities such as bot-generated views or artificial traffic manipulation will result in account termination and forfeiture of earnings.
              There is no refund money applicable.
              We are not responsible if ads are not displayed in the AdTip app.
              Payments will be processed after necessary verifications and may take up to 30 business days.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Advertiser Obligations</h2>
            <p className="text-gray-700">
              Advertisers must ensure their ads comply with local laws and regulations.
              False, misleading, or illegal advertisements will be removed, and associated accounts may be suspended.
              AdTip is not responsible for user interactions with third-party advertisements.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Voice & App Calls</h2>
            <p className="text-gray-700">
              AdTip facilitates in-app calls but holds no responsibility for fraudulent or misleading activity during such interactions.
              Users are advised to exercise caution when communicating with others.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. User Responsibilities</h2>
            <p className="text-gray-700">
              Users must follow ethical guidelines and refrain from hate speech, harassment, explicit content, or any form of abuse.
              Violations of these guidelines may result in temporary or permanent suspension of the account.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Liability & Disclaimers</h2>
            <p className="text-gray-700">
              AdTip Co. is not liable for any loss, damage, or legal claims arising from the use of our platform.
              We do not guarantee uninterrupted service, and users agree to use AdTip at their own risk.
              We are not responsible for third-party services, transactions, or interactions facilitated through the platform.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Data Protection & Privacy</h2>
            <p className="text-gray-700">
              We collect and store user data per our Privacy Policy.
              Users acknowledge and consent to data collection for platform functionality and personalization.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Account Suspension & Termination</h2>
            <p className="text-gray-700">
              AdTip reserves the right to suspend or terminate accounts involved in fraudulent, illegal, or unethical activities.
              Users may request account deletion by contacting support@adtip.in.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Policy Updates</h2>
            <p className="text-gray-700">
              We may update these terms at any time. Continued use of the platform constitutes acceptance of the revised terms.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">12. International Transactions & Currency Conversion</h2>
            <p className="text-gray-700">
              AdTip supports international payments. By initiating an international transaction, users agree to any additional processing fees or currency conversion charges applied by their payment provider or financial institution.
              All transactions will be processed in INR, USD, or other supported currencies, and the equivalent amount in the user's local currency will be determined by the payment gateway's exchange rate at the time of transaction.
              AdTip is not responsible for exchange rate fluctuations, international transaction fees, or delays caused by cross-border banking procedures.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">13. Refund Policy</h2>
            <p className="text-gray-700">
              All payments made on AdTip are non-refundable unless required by applicable law or stated otherwise in writing.
              In the case of failed transactions or billing errors, users must contact support@adtip.in within 7 business days.
              AdTip will review refund requests on a case-by-case basis. Any approved refund will be made using the original payment method.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">14. Legal Compliance</h2>
            <p className="text-gray-700">
              AdTip complies with applicable international laws and regulations, including anti-money laundering (AML), anti-fraud, and data protection laws.
              Users engaging in international payments must ensure their activities are lawful in their jurisdiction. Any suspicious, fraudulent, or illegal transactions will be reported to relevant authorities.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">15. Dispute Resolution</h2>
            <p className="text-gray-700">
              In case of any disputes related to payments or platform usage, users agree to first attempt resolution by contacting AdTip support.
              If unresolved, the matter will be governed by Indian law and may be subject to arbitration or legal proceedings in Mumbai, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
