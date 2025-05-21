import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BadgeDollarSign } from "lucide-react";

const Onboarding = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      // Redirect to home page immediately for non-authenticated users
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center animate-fade-in">
        <div className="w-24 h-24 flex items-center justify-center">
          <BadgeDollarSign className="h-12 w-12 text-teal-600" />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;