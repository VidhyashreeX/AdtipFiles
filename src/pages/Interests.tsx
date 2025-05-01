
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

const categories = [
  "Art", "Design", "Beauty", "Business", "Memes", "Actors", "Dance",
  "Digital Art", "Fashion", "Fitness", "Travel", "Food", "Pets",
  "Photography", "DIY & Crafts", "Motivation", "Technology", "Gadgets",
  "Finance", "Marketing", "Comedy", "Singing", "Tutorials", "Makeup",
  "Home Decor", "Gaming", "Animation", "Quotes", "Nature", "Spirituality"
];

const Interests = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();

  const toggleCategory = (category: string) => {
    setSelected((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        if (prev.length >= 6) {
          setError("You can select up to 6 interests");
          return prev;
        }
        setError("");
        return [...prev, category];
      }
    });
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      setError("Please select at least one interest");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      updateUserProfile({ interests: selected });
      setIsLoading(false);
      navigate("/home");
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-8">
        <button 
          onClick={() => navigate("/personal-details")} 
          className="text-gray-500 flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2 text-center">
          Choose your interests
        </h1>
        
        <p className="text-center text-gray-500 mb-8">
          Select up to 6 categories that interest you the most
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((category) => (
            <div
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-4 py-2 rounded-full cursor-pointer transition-all ${
                selected.includes(category)
                  ? "bg-adtip-teal text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {category}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <div className="mt-auto">
          <Button
            onClick={handleSubmit}
            className="teal-button w-full"
            disabled={isLoading || selected.length === 0}
          >
            {isLoading ? "Setting up your profile..." : "Continue"}
          </Button>
          
          <p className="text-center text-gray-500 text-sm mt-4">
            Selected: {selected.length}/6
          </p>
        </div>
      </div>
    </div>
  );
};

export default Interests;
