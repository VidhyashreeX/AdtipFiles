import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PaidVideoPromptProps {
  onClose: () => void;
  onContinue: () => void;
  pricePerMinute: number;
  videoDuration: number;
  videoTitle: string;
  creatorName: string;
}

const PaidVideoPrompt = ({
  onClose,
  onContinue,
  pricePerMinute,
  videoDuration,
  videoTitle,
  creatorName,
}: PaidVideoPromptProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const totalPrice = pricePerMinute * Math.ceil(videoDuration / 60); // Convert seconds to minutes and round up
  const userBalance = user?.wallet || 0;
  const hasEnoughBalance = userBalance >= totalPrice;
  
  const handleContinue = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (!hasEnoughBalance) {
      navigate("/wallet");
      toast({
        title: "Insufficient balance",
        description: "Please add money to your wallet to watch this video",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Deduct amount from wallet
      if (user) {
        // Here we're keeping the deduction functionality but not adding money for watching
        updateUserProfile({
          wallet: userBalance - totalPrice,
        });
      }
      
      setIsProcessing(false);
      onContinue();
      
      toast({
        title: "Payment successful",
        description: `₹${totalPrice} has been deducted from your wallet`,
      });
    }, 1000);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-white w-full max-w-md rounded-lg p-5 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500">
          <X size={20} />
        </button>
        
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold mb-1">Paid Video</h2>
          <p className="text-gray-600 text-sm">
            This is premium content by <span className="font-medium">{creatorName}</span>
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-1 line-clamp-2">{videoTitle}</h3>
          <div className="flex items-center justify-between text-sm">
            <span>Duration: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}</span>
            <span className="text-adtip-teal font-medium">₹{pricePerMinute}/min</span>
          </div>
        </div>
        
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">Total Price:</span>
            <span className="font-bold text-lg">₹{totalPrice}</span>
          </div>
          {isAuthenticated && (
            <div className="flex justify-between items-center text-sm">
              <span>Your wallet balance:</span>
              <span className={hasEnoughBalance ? "text-green-600" : "text-red-600"}>
                ₹{userBalance} {!hasEnoughBalance && "(Insufficient)"}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="teal-button w-full"
            disabled={isProcessing}
          >
            {isProcessing 
              ? "Processing..." 
              : isAuthenticated 
                ? hasEnoughBalance 
                  ? "Pay & Watch Now" 
                  : "Add Money to Wallet" 
                : "Login to Continue"
            }
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaidVideoPrompt;
