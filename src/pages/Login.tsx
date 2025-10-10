import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("phone");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setIsLoading(true);
    // Set tempUserId and other required values before redirect
    localStorage.removeItem("email");
    localStorage.removeItem("mobile_number");
    localStorage.removeItem("tempUserId");
    localStorage.removeItem("otpCountdown");
    localStorage.setItem("mobile_number", phoneNumber);
    localStorage.setItem("tempUserId", "pending");
    localStorage.setItem("otpCountdown", (Math.floor(Date.now() / 1000) + 30).toString());
    navigate("/verify-otp");
    try {
      // Use the correct API integration for phone OTP
      const response = await login(phoneNumber);
      // Accept both array and object for data
      let userData = null;
      if (response?.data?.data) {
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          userData = response.data.data[0];
        } else if (typeof response.data.data === "object" && response.data.data.id) {
          userData = response.data.data;
        }
      }
      if (userData && userData.id) {
        localStorage.setItem("tempUserId", userData.id.toString());
      }
      toast.success("OTP sent successfully");
    } catch (err: any) {
      // Show backend error message if available
      let errorMsg = err?.response?.data?.message || err.message || "Could not send OTP. Please try again.";
      if (typeof errorMsg === 'object') {
        // If errorMsg is an object (e.g. SQL error), safely stringify
        errorMsg = errorMsg.sqlMessage || JSON.stringify(errorMsg);
      }
      console.error("Login error:", err);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-background">
      <div className="mb-8">
        <button
          onClick={() => navigate("/onboarding")}
          className="text-muted-foreground flex items-center hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center text-foreground">
          Welcome to AdTip
        </h1>

        <p className="text-center text-muted-foreground mb-8">
          Choose your preferred login method
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-8 bg-muted">
            <TabsTrigger value="phone">Phone Login</TabsTrigger>
          </TabsList>

          <TabsContent value="phone">
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="border border-border rounded-md overflow-hidden focus-within:border-adtip-teal focus-within:ring-1 focus-within:ring-adtip-teal bg-background">
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 border-none focus-visible:ring-0"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-adtip-teal hover:bg-adtip-teal/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our</p>
          <p>
            <a href="/terms" className="text-adtip-teal hover:text-adtip-teal/90 transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-adtip-teal hover:text-adtip-teal/90 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;