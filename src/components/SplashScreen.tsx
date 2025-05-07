
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      navigate("/onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <img 
          src="logo.png" 
          alt="AdTip Logo" 
          className="h-24 w-24 animate-pulse" 
        />
        <h1 className="mt-4 text-3xl font-bold text-adtip-teal">AdTip</h1>
      </div>
    </div>
  );
};

export default SplashScreen;
