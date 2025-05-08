import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

// Use the environment variable for the base URL with /api path appended if needed
const BASE_URL = import.meta.env.VITE_API_URL?.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`;

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const userId = localStorage.getItem("User  Id") || "54625"; // Ensure this is the correct user ID
  const token = localStorage.getItem("User  LoggedIn") || ""; // Ensure this is a valid token

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/getfunds/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          setBalance(response.data.data.balance || 0);
        } else {
          setError("Failed to fetch balance");
        }
      } catch (err: any) {
        console.error("API Error:", err.response || err.message);
        setError("Error fetching balance");
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [userId, token]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/gettransactions/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          setTransactions(response.data.data.transactions || []);
        } else {
          setError("Failed to fetch transactions");
        }
      } catch (err: any) {
        console.error("API Error:", err.response || err.message);
        setError("Error fetching transactions");
      }
    };
    fetchTransactions();
  }, [userId, token]);

  // Handle withdrawal
  const handleWithdraw = () => {
    if (Number(withdrawAmount) > balance) {
      alert("Insufficient balance");
      return;
    }
    if (!selectedMethod) {
      alert("Please select a withdrawal method");
      return;
    }
    if (Number(withdrawAmount) < 50) {
      alert("Minimum withdrawal amount is ₹50");
      return;
    }
    alert(`Withdrawal of ₹${withdrawAmount} initiated via ${selectedMethod}!`);
    navigate("/home");
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: any[] } = {};
  transactions.forEach((transaction) => {
    const date = new Date(transaction.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });

  return (
    <div className="pb-20 md:pb-0 bg-gray-50 min-h-screen">
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
              <div className="text-4xl font-bold mb-4">₹{balance}</div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                className="bg-white text-adtip-teal hover:bg-white/90"
                onClick={() => navigate("/add-funds")}
              >
                Add Money
              </Button>
              <Button className="bg-white text-adtip-teal hover:bg-white/90" onClick={() => {}}>
                Withdraw
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* No Active Plan */}
      <div className="max-w-screen-md mx-auto p-4 bg-white rounded-lg shadow-sm mt-4">
        <div className="text-center py-6">
          <h3 className="text-lg font-medium mb-2">No Active Subscription Plan</h3>
          <p className="text-gray-500 text-sm mb-4">
            Upgrade to premium to enjoy better features and higher earnings
          </p>
          <Button className="teal-button" onClick={() => navigate("/upgrade-premium")}>
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-screen-md mx-auto p-4 mt-4">
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <div className="space-y-6">
              <Tabs defaultValue="earnings">
                <TabsList className="w-full mb-4">
                  <TabsTrigger className="flex-1" value="earnings">
                    My Ads Earnings
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="withdrawals">
                    Withdrawal Requests
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="earnings" className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-center py-10">
                    {transactions.length === 0 ? (
                      <p className="text-gray-500">No Transactions</p>
                    ) : (
                      Object.entries(groupedTransactions).map(([date, items]) => (
                        <div key={date} className="mb-4">
                          <h4 className="font-semibold mb-2">{date}</h4>
                          {items.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between border-b border-gray-200 py-2">
                              <span>{transaction.description}</span>
                              <span>₹{transaction.amount}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="withdrawals" className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-center py-10">
                    <p className="text-gray-500">No Withdrawal Requests</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value ="withdraw">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Withdraw to</h3>

              <div className="space-y-3 mb-6">
                {["PayTM", "Bank Transfer", "UPI"].map((method) => (
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
                          : method === "Bank Transfer"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    >
                      {method[0]}
                    </div>
                    <div className="ml-3">{method}</div>
                    <div className="ml-auto">
                      <div
                        className={`w-5 h-5 rounded-full border ${
                          selectedMethod === method ? "border-adtip-teal" : "border-gray-300"
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
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
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