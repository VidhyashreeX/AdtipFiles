
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowDown, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Sample transaction data
const transactions = [
  {
    id: 1,
    type: "credit",
    amount: 50,
    description: "Video view rewards",
    date: "2023-09-15",
  },
  {
    id: 2,
    type: "credit",
    amount: 25,
    description: "Referral bonus",
    date: "2023-09-14",
  },
  {
    id: 3,
    type: "debit",
    amount: 100,
    description: "Withdrawal to PayTM",
    date: "2023-09-10",
  },
  {
    id: 4,
    type: "credit",
    amount: 75,
    description: "Content creation reward",
    date: "2023-09-08",
  },
  {
    id: 5,
    type: "credit",
    amount: 15,
    description: "Daily login bonus",
    date: "2023-09-07",
  },
];

const SubscriptionPlan = ({ 
  duration, 
  price, 
  isPopular 
}: { 
  duration: string; 
  price: number; 
  isPopular?: boolean 
}) => {
  return (
    <div className={`border rounded-lg p-6 relative ${isPopular ? "border-adtip-teal" : "border-gray-200"}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-adtip-teal text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
          Popular
        </div>
      )}
      <h3 className="text-xl font-bold">{duration}</h3>
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-bold">₹{price}</span>
        <span className="text-gray-500 text-sm ml-1">/ {duration.toLowerCase()}</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>All premium features</span>
        </li>
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>Faster withdrawals</span>
        </li>
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>Lower fees</span>
        </li>
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>Higher earnings</span>
        </li>
      </ul>
      <Button className="w-full mt-6 teal-button">Select Plan</Button>
    </div>
  );
};

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);

  const handleWithdraw = () => {
    alert(`Withdrawal of ₹${withdrawAmount} initiated via ${selectedMethod}!`);
    navigate("/home");
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: typeof transactions } = {};
  transactions.forEach(transaction => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    
    groupedTransactions[date].push(transaction);
  });

  if (showUpgradePlans) {
    return (
      <div className="pb-20 md:pb-0 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white">
          <div className="max-w-screen-md mx-auto p-6">
            <div className="flex items-center mb-8">
              <button onClick={() => setShowUpgradePlans(false)}>
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold ml-2">Upgrade Plan</h1>
            </div>
          </div>
        </div>

        <div className="max-w-screen-md mx-auto p-4">
          <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SubscriptionPlan duration="1 Month" price={200} />
            <SubscriptionPlan duration="6 Months" price={1200} isPopular />
            <SubscriptionPlan duration="1 Year" price={2400} />
          </div>
        </div>
      </div>
    );
  }

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
            <div className="text-4xl font-bold mb-4">₹{user?.wallet || '0'}</div>
            <div className="flex justify-center gap-4">
              <Button className="bg-white text-adtip-teal hover:bg-white/90">
                Add Money
              </Button>
              <Button className="bg-white text-adtip-teal hover:bg-white/90">
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
          <p className="text-gray-500 text-sm mb-4">Upgrade to premium to enjoy better features and higher earnings</p>
          <Button className="teal-button" onClick={() => setShowUpgradePlans(true)}>
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
            {/* Transactions list */}
            <div className="space-y-6">
              <Tabs defaultValue="earnings">
                <TabsList className="w-full mb-4">
                  <TabsTrigger className="flex-1" value="earnings">My Ads Earnings</TabsTrigger>
                  <TabsTrigger className="flex-1" value="withdrawals">Withdrawal Requests</TabsTrigger>
                </TabsList>
                
                <TabsContent value="earnings" className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-center py-10">
                    <p className="text-gray-500">No Transactions</p>
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
          
          <TabsContent value="withdraw">
            {/* Withdraw form */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Withdraw to</h3>
              
              <div className="space-y-3 mb-6">
                <div 
                  onClick={() => setSelectedMethod("PayTM")}
                  className={`border rounded-lg p-4 flex items-center cursor-pointer transition-colors ${
                    selectedMethod === "PayTM" ? "border-adtip-teal bg-adtip-teal/5" : "border-gray-200"
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div className="ml-3">PayTM</div>
                  <div className="ml-auto">
                    <div className={`w-5 h-5 rounded-full border ${
                      selectedMethod === "PayTM" ? "border-adtip-teal" : "border-gray-300"
                    } flex items-center justify-center`}>
                      {selectedMethod === "PayTM" && (
                        <div className="w-3 h-3 rounded-full bg-adtip-teal"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => setSelectedMethod("Bank Transfer")}
                  className={`border rounded-lg p-4 flex items-center cursor-pointer transition-colors ${
                    selectedMethod === "Bank Transfer" ? "border-adtip-teal bg-adtip-teal/5" : "border-gray-200"
                  }`}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <div className="ml-3">Bank Transfer</div>
                  <div className="ml-auto">
                    <div className={`w-5 h-5 rounded-full border ${
                      selectedMethod === "Bank Transfer" ? "border-adtip-teal" : "border-gray-300"
                    } flex items-center justify-center`}>
                      {selectedMethod === "Bank Transfer" && (
                        <div className="w-3 h-3 rounded-full bg-adtip-teal"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => setSelectedMethod("UPI")}
                  className={`border rounded-lg p-4 flex items-center cursor-pointer transition-colors ${
                    selectedMethod === "UPI" ? "border-adtip-teal bg-adtip-teal/5" : "border-gray-200"
                  }`}
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-md flex items-center justify-center text-white font-bold">
                    U
                  </div>
                  <div className="ml-3">UPI</div>
                  <div className="ml-auto">
                    <div className={`w-5 h-5 rounded-full border ${
                      selectedMethod === "UPI" ? "border-adtip-teal" : "border-gray-300"
                    } flex items-center justify-center`}>
                      {selectedMethod === "UPI" && (
                        <div className="w-3 h-3 rounded-full bg-adtip-teal"></div>
                      )}
                    </div>
                  </div>
                </div>
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
                  max={user?.wallet || 0}
                  className="w-full px-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-adtip-teal"
                />
              </div>
              
              <Button 
                onClick={handleWithdraw} 
                disabled={!selectedMethod || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > (user?.wallet || 0)}
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
