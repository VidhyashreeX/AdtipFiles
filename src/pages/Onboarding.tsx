import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { 
  ArrowRight, 
  ChevronsRight,
  Users, 
  BadgeDollarSign 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OnboardingStep = ({ 
  title, 
  subtext, 
  icon,
  onContinue,
  buttonText = "Continue" 
}: { 
  title: string; 
  subtext: string; 
  icon: React.ReactNode; 
  onContinue: () => void;
  buttonText?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 text-center animate-fade-in">
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mb-8">
          {icon}
        </div>
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 mb-12 max-w-xs">{subtext}</p>
      </div>
      <Button onClick={onContinue} className="bg-teal-500 hover:bg-teal-600 w-full max-w-xs">
        {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
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
      title: "Post Content & Earn More!",
      subtext: "Get paid for every view—turn your audience into earnings!",
      icon: <BadgeDollarSign className="h-12 w-12 text-teal-600" />, 
    },
    {
      title: "Upgrade to Premium & Earn More!",
      subtext: "Get paid for every view—turn your audience into earnings!",
      icon: <Users className="h-12 w-12 text-teal-600" />, 
    },
    {
      title: "Refer & Earn ₹3 per Referral!",
      subtext: "Upgrade with a coupon code & get ₹30 instantly",
      icon: <ChevronsRight className="h-12 w-12 text-teal-600" />,
      buttonText: "Let's start earning" 
    },
  ];

  const handleContinue = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      // Navigate to EarnOpportunities
      navigate("/earn-opportunities");
    }
  };

  const currentStep = onboardingSteps[step];

  return (
    <div className="bg-white">
      <OnboardingStep
        title={currentStep.title}
        subtext={currentStep.subtext}
        icon={currentStep.icon}
        onContinue={handleContinue}
        buttonText={currentStep.buttonText || "Next"}
      />
      <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-2">
        {onboardingSteps.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === step ? "w-8 bg-teal-500" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
