
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

const OnboardingStep = ({ 
  title, 
  subtext, 
  image, 
  onContinue 
}: { 
  title: string; 
  subtext: string; 
  image: string; 
  onContinue: () => void 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-fade-in">
      <div className="max-w-sm mb-8">
        <img src={image} alt={title} className="w-full h-auto" />
      </div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600 mb-12 max-w-xs">{subtext}</p>
      <Button onClick={onContinue} className="teal-button w-full max-w-xs">
        Continue
      </Button>
    </div>
  );
};

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const onboardingSteps = [
    {
      title: "Watch to earn ₹₹₹",
      subtext: "TipTube is a great place to enjoy your favourite content and to earn some cash while watching in between ads!",
      image: "/placeholder.svg", 
    },
    {
      title: "Talk to earn",
      subtext: "Share your expertise through one-on-one calls and get paid",
      image: "/lovable-uploads/1052f74a-1ca9-4c6f-b7ad-09d964f20cd1.png", 
    },
    {
      title: "Share to earn",
      subtext: "Refer friends and earn from their activity on the platform",
      image: "/lovable-uploads/72f5c267-38ea-445e-8274-48983cc47467.png", 
    },
  ];

  const handleContinue = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      // Navigate to EarnOpportunities instead of home
      navigate("/earn-opportunities");
    }
  };

  const currentStep = onboardingSteps[step];

  return (
    <div className="bg-white">
      <OnboardingStep
        title={currentStep.title}
        subtext={currentStep.subtext}
        image={currentStep.image}
        onContinue={handleContinue}
      />
      <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-2">
        {onboardingSteps.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === step ? "w-8 bg-adtip-teal" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
