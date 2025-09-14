import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;

const Wallet = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || null;
  const token = user?.accessToken || null;

  // Wait for AuthContext to initialize
  useEffect(() => {
    if (user === null && isAuthenticated === false) {
      return;
    }
    setAuthLoading(false);
    if (!userId || !token) {
      setError("Please sign in to view your wallet.");
      navigate("/login");
    }
  }, [user, isAuthenticated, userId, token, navigate]);

  // Fetch wallet balance and premium status
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!userId || !token) return;
      try {
        setLoading(true);

        // Fetch balance
        const balanceResponse = await axios.get(`${BASE_URL}/getfunds/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (balanceResponse.status === 200) {
          setBalance(parseFloat(balanceResponse.data.availableBalance) || 0);
        } else {
          throw new Error(`Unexpected response status: ${balanceResponse.status}`);
        }

        // Fetch content-premium status
        const premiumResponse = await axios.get(`${BASE_URL}/content-premium/status/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (premiumResponse.status === 200) {
          setIsPremium(premiumResponse.data.status === true);
        } else {
          throw new Error(`Unexpected response status: ${premiumResponse.status}`);
        }

      } catch (err: any) {
        console.error("Wallet data error:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          setError("Unauthorized. Please sign in again.");
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Error fetching wallet data");
        }
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) {
      fetchWalletData();
    }
  }, [userId, token, navigate, authLoading]);

  // Handle withdrawal
  const handleWithdraw = () => {
    if (!userId || !token) {
      setError("Please sign in to withdraw funds.");
      navigate("/login");
      return;
    }
    if (Number(withdrawAmount) > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!selectedMethod) {
      toast.error("Please select a withdrawal method");
      return;
    }
    if (Number(withdrawAmount) < 50) {
      toast.error("Minimum withdrawal amount is ₹50");
      return;
    }
    toast.success(`Withdrawal of ₹${withdrawAmount} initiated via ${selectedMethod}!`);
    navigate("/home");
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!userId || !token) return null;

  return (
    <div className="pb-20 md:pb̔-0 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white">
        <div className="max-w-screen-md mx-auto p-6">
          <div className="flex items-center mb-8">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold ml-2">Wallet</h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-sm font-medium mb-1">Available Balance</h2>
            {loading ? (
              <div className="text-4xl font-bold mb-4">Loading...</div>
            ) : error ? (
              <div className="text-red-500 mb-4">{error}</div>
            ) : (
              <div className="text-4xl font-bold mb-4">₹{balance.toFixed(2)}</div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                className="bg-white text-adtip-teal hover:bg-white/90"
                onClick={() => navigate("/add-funds")}
              >
                Add Money
              </Button>
              <Button
                className="bg-white text-adtip-teal hover:bg-white/90"
                onClick={() => {}}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="max-w-screen-md mx-auto p-4 bg-white rounded-lg shadow-sm mt-4">
        <div className="text-center py-6">
          {loading ? (
            <h3 className="text-lg font-medium mb-2">Loading subscription status...</h3>
          ) : isPremium ? (
            <>
              <h3 className="text-lg font-medium mb-2">Content Creator Premium Active</h3>
              <p className="text-gray-500 text-sm mb-4">
                Enjoy enhanced content creation features and higher earnings with your premium plan
              </p>
              <Button
                className="teal-button"
                onClick={() => navigate("/choose-plan", { state: { openCreatorPacks: true } })}
              >
                Manage Subscription
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">No Active Content Creator Plan</h3>
              <p className="text-gray-500 text-sm mb-4">
                Upgrade to content creator premium to enjoy better features and higher earnings
              </p>
              <Button
                className="teal-button"
                onClick={() => navigate("/choose-plan", { state: { openCreatorPacks: true } })}
              >
                Upgrade to Creator Plan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-screen-md mx-auto p-4 mt-4">
        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid grid-cols-1 w-full mb-4">
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Withdraw to</h3>

              <div className="space-y-3 mb-6">
                {["PayTM", "PhonePe", "Bank Transfer", "UPI"].map((method) => (
                  <div
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    className={`border rounded-lg p-4 flex items-center cursor-pointer transition-colors ${
                      selectedMethod === method
                        ? "border-adtip-teal bg-adtip-teal/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-bold ${
                        method === "PayTM"
                          ? "bg-blue-500"
                          : method === "PhonePe"
                          ? "bg-purple-500"
                          : method === "Bank Transfer"
                          ? "bg-green-500"
                          : "bg-orange-500"
                      }`}
                    >
                      {method[0]}
                    </div>
                    <div className="ml-3">{method}</div>
                    <div className="ml-auto">
                      <div
                        className={`w-5 h-5 rounded-full border ${
                          selectedMethod === method
                            ? "border-adtip-teal"
                            : "border-gray-300"
                        } flex items-center justify-center`}
                      >
                        {selectedMethod === method && (
                          <div className="w-3 h-3 rounded-full bg-adtip-teal"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold mb-4">Enter amount</h3>
              <div className="relative mb-6">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  max={balance}
                  className="w-full px-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-adtip-teal"
                />
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={
                  !selectedMethod ||
                  !withdrawAmount ||
                  Number(withdrawAmount) <= 0 ||
                  Number(withdrawAmount) > balance
                }
                className="teal-button w-full"
              >
                Withdraw
              </Button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Minimum withdrawal amount: ₹50
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;