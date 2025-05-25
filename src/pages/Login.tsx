import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("phone");
  const navigate = useNavigate();
  const { login, loginWithEmail, loginWithGoogle } = useAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setIsLoading(true);
    try {
      const response = await login(phoneNumber);
      console.log("Phone OTP API response:", response);

      // Check for proper response format
      if (!response?.data?.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        throw new Error("Invalid response format from server");
      }

      const userData = response.data.data[0];
      if (!userData.id) {
        throw new Error("Missing user ID in response");
      }

      // Clear existing data
      localStorage.removeItem("email");
      localStorage.removeItem("mobile_number");
      localStorage.removeItem("tempUserId");
      localStorage.removeItem("otpCountdown");

      // Set new data
      localStorage.setItem("mobile_number", phoneNumber);
      localStorage.setItem("tempUserId", userData.id.toString());
      localStorage.setItem("otpCountdown", (Math.floor(Date.now() / 1000) + 30).toString());

      console.log("Stored login data:", {
        mobile: phoneNumber,
        tempUserId: userData.id,
        countdown: Math.floor(Date.now() / 1000) + 30
      });

      toast.success("OTP sent successfully");
      navigate("/verify-otp");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Could not send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const response = await loginWithEmail(email);
      console.log("Email OTP API response:", response);

      // Check for proper response format
      if (!response?.data?.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        throw new Error("Invalid response format from server");
      }

      const userData = response.data.data[0];
      if (!userData.id) {
        throw new Error("Missing user ID in response");
      }

      // Clear existing data
      localStorage.removeItem("email");
      localStorage.removeItem("mobile_number");
      localStorage.removeItem("tempUserId");
      localStorage.removeItem("otpCountdown");

      // Set new data
      localStorage.setItem("email", email);
      localStorage.setItem("tempUserId", userData.id.toString());
      localStorage.setItem("otpCountdown", (Math.floor(Date.now() / 1000) + 30).toString());

      console.log("Stored login data:", {
        email,
        tempUserId: userData.id,
        countdown: Math.floor(Date.now() / 1000) + 30
      });

      toast.success("OTP sent successfully");
      navigate("/verify-otp");
    } catch (err: any) {
      console.error("Email login error:", err);
      toast.error(err.message || "Could not send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Initialize Google Sign-In
      const googleAuth = window.gapi?.auth2?.getAuthInstance();
      if (!googleAuth) {
        throw new Error("Google Sign-In not initialized");
      }

      const googleUser = await googleAuth.signIn();
      const token = googleUser.getAuthResponse().id_token;

      const response = await loginWithGoogle(token);
      if (response?.data?.success) {
        toast.success("Successfully logged in with Google");
        navigate("/");
      } else {
        throw new Error("Failed to authenticate with Google");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      toast.error(err.message || "Could not authenticate with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-white">
      <div className="mb-8">
        <button
          onClick={() => navigate("/onboarding")}
          className="text-gray-500 flex items-center hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">
          Welcome to AdTip
        </h1>

        <p className="text-center text-gray-600 mb-8">
          Choose your preferred login method
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="phone">
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="border border-gray-300 rounded-md overflow-hidden focus-within:border-adtip-teal focus-within:ring-1 focus-within:ring-adtip-teal">
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

          <TabsContent value="email">
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="border border-gray-300 rounded-md overflow-hidden focus-within:border-adtip-teal focus-within:ring-1 focus-within:ring-adtip-teal">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <FcGoogle className="h-5 w-5" />
          <span>Continue with Google</span>
        </Button>

        <div className="mt-8 text-center text-sm text-gray-600">
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