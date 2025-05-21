
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
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-gray-700">
              We collect various types of information to provide and improve our services, including:
              phone number, device information, location data (with your permission), user behavior and 
              interactions with content, and information you provide in your profile.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-700">
              We use your information to deliver personalized content and advertisements, provide rewards, 
              detect and prevent fraud, improve our services, communicate with you about updates or changes, 
              and comply with legal obligations.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Sharing of Information</h2>
            <p className="text-gray-700">
              We don't sell user data. However, we may share information with analytics providers, 
              advertising partners, payment processors, and service providers who help us operate our platform. 
              We may also share information when required by law or to protect our rights.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use cookies and similar technologies for performance, analytics, and ad targeting. 
              You can manage cookie preferences through your browser settings, though this may impact 
              your ability to use certain features of our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Security Measures</h2>
            <p className="text-gray-700">
              We employ encryption, secure servers, and limited data access policies to protect your 
              information. However, no method of transmission over the Internet or electronic storage is 
              100% secure, so we cannot guarantee absolute security.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. User Rights</h2>
            <p className="text-gray-700">
              You can request deletion or correction of your personal data by contacting us. 
              You may also opt out of certain data collection or marketing communications through 
              settings in the app.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-gray-700">
              We do not knowingly collect data from children under 13. If you believe we have collected 
              information from a child under 13, please contact us to have it removed.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Updates to Policy</h2>
            <p className="text-gray-700">
              We'll notify you of any material changes to this Privacy Policy through the app or via email. 
              Your continued use of our services after such notification constitutes acceptance of the updated policy.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions or concerns about our Privacy Policy or data practices, please contact us at 
              <a href="mailto:privacy@adtip.com" className="text-adtip-teal"> privacy@adtip.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
