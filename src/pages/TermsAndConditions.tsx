
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen p-6 pb-20 bg-background">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-muted-foreground hover:text-foreground flex items-center transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-8 text-foreground">Terms & Conditions</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to AdTip. These terms govern your access and use of our services. 
              By accessing or using our services, you agree to be bound by these terms.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">2. Account Registration</h2>
            <p className="text-muted-foreground">
              Users must be 18 years or older to use our services. You agree to provide accurate, complete, 
              and up-to-date information during the registration process and to update such information 
              to keep it accurate, complete, and current.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">3. Earnings & Payouts</h2>
            <p className="text-muted-foreground">
              Users earn money through watching ads, participating in calls, referrals, and other activities 
              on our platform. AdTip reserves the right to modify the earning terms at any time with 
              reasonable notice to users. Withdrawals are subject to minimum amounts and verification checks.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">4. Prohibited Actions</h2>
            <p className="text-muted-foreground">
              The following actions are strictly prohibited and may result in account termination:
              creating fake accounts, using bots or automated systems to earn rewards, spamming, 
              posting abusive content, or attempting to manipulate the reward system in any way.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">5. Content Rights</h2>
            <p className="text-muted-foreground">
              Users retain ownership of content they create and share on AdTip, but grant us permission 
              to display, distribute, and promote such content on our platform. We may use your content 
              for promotional purposes without additional compensation.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">6. Suspension & Termination</h2>
            <p className="text-muted-foreground">
              AdTip reserves the right to suspend or terminate accounts that violate these terms or 
              engage in fraudulent activity. We may also suspend accounts for technical issues, 
              security concerns, or at the request of law enforcement authorities.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              AdTip is not responsible for losses due to app bugs, third-party issues, or user errors. 
              Our liability is limited to the amount earned by a user in the 30 days preceding any claim.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">8. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by the laws of India, without regard to its conflict of 
              laws principles. Any disputes shall be subject to the exclusive jurisdiction of the courts 
              in New Delhi, India.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">9. Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms & Conditions, please contact us at 
              <a href="mailto:support@adtip.com" className="text-adtip-teal hover:text-adtip-teal/80"> support@adtip.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
