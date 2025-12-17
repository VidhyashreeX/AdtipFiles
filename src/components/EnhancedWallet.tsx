import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useAuthModal } from "../contexts/AuthModalContext";
import { 
  useEnhancedWalletState, 
  useEnhancedPremiumState, 
  useEnhancedTransactions,
  useEnhancedInitializeWalletData,
  useEnhancedInitializePremiumData,
  useEnhancedRefreshWalletBalance,
  useEnhancedRefreshPremiumStatus,
  useEnhancedFormatCurrency,
  useEnhancedClearError
} from "../stores/enhanced-wallet-premium.store";
import { cn } from "@/lib/utils";

const EnhancedWallet = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  
  // State from store
  const walletState = useEnhancedWalletState();
  const premiumState = useEnhancedPremiumState();
  const transactions = useEnhancedTransactions();
  
  // Actions from store
  const initializeWalletData = useEnhancedInitializeWalletData();
  const initializePremiumData = useEnhancedInitializePremiumData();
  const refreshWalletBalance = useEnhancedRefreshWalletBalance();
  const refreshPremiumStatus = useEnhancedRefreshPremiumStatus();
  const formatCurrency = useEnhancedFormatCurrency();
  const clearError = useEnhancedClearError();

  // Local state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userId = user?.id?.toString();

  // Initialize data on mount
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      openLoginModal();
      return;
    }

    // Initialize both wallet and premium data
    const initData = async () => {
      try {
        await Promise.all([
          initializeWalletData(userId),
          initializePremiumData(userId)
        ]);
      } catch (error) {
        console.error('Failed to initialize wallet/premium data:', error);
      }
    };

    initData();
  }, [isAuthenticated, userId, openLoginModal]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!userId) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshWalletBalance(userId),
        refreshPremiumStatus(userId)
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!userId) {
      openLoginModal();
      return;
    }

    const amount = Number(withdrawAmount);
    
    if (amount > walletState.balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!selectedMethod) {
      toast.error("Please select a withdrawal method");
      return;
    }
    if (amount < 50) {
      toast.error("Minimum withdrawal amount is ₹50");
      return;
    }

    // Here you would integrate with your withdrawal API
    // For now, we'll simulate the process
    toast.success(`Withdrawal of ${formatCurrency(amount)} initiated via ${selectedMethod}!`);
    
    // Add transaction to history
    // addTransaction({
    //   type: 'withdrawal',
    //   amount,
    //   currency: 'INR',
    //   status: 'pending',
    //   description: `Withdrawal via ${selectedMethod}`,
    // });

    setWithdrawAmount("");
    setSelectedMethod(null);
  };

  // Clear errors when user interacts
  useEffect(() => {
    if (walletState.error || premiumState.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [walletState.error, premiumState.error, clearError]);

  if (!isAuthenticated || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to access your wallet</p>
          <Button onClick={openLoginModal} className="mt-4">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white dark:from-teal-700 dark:to-teal-800">
        <div className="max-w-screen-md mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold ml-2">Wallet</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || walletState.isLoading}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw className={cn("h-5 w-5", (isRefreshing || walletState.isLoading) && "animate-spin")} />
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-sm font-medium mb-1">Available Balance</h2>
            
            {/* Balance Display */}
            {walletState.isLoading ? (
              <div className="text-4xl font-bold mb-4">
                <div className="animate-pulse bg-white/20 rounded h-12 w-48 mx-auto"></div>
              </div>
            ) : walletState.error ? (
              <div className="text-red-200 mb-4 p-3 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 inline mr-2" />
                {walletState.error}
              </div>
            ) : (
              <div className="text-4xl font-bold mb-4">
                {formatCurrency(walletState.balance)}
              </div>
            )}

            {/* Last Updated */}
            {walletState.lastUpdated > 0 && (
              <p className="text-xs text-white/70 mb-4">
                Last updated: {new Date(walletState.lastUpdated).toLocaleTimeString()}
              </p>
            )}

            <div className="flex justify-center gap-4">
              <Button
                className="bg-white text-adtip-teal hover:bg-white/90"
                onClick={() => navigate("/add-funds")}
                disabled={walletState.isLoading}
              >
                Add Money
              </Button>
              <Button
                className="bg-white text-adtip-teal hover:bg-white/90"
                disabled={walletState.isLoading || walletState.balance <= 0}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Status */}
      <div className="max-w-screen-md mx-auto p-4 bg-card border border-border rounded-lg shadow-sm mt-4">
        <div className="text-center py-6">
          {premiumState.isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-40 mx-auto"></div>
            </div>
          ) : premiumState.error ? (
            <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 inline mr-2" />
              {premiumState.error}
            </div>
          ) : (
            <>
              {/* Premium Status Display */}
              <div className="flex items-center justify-center mb-2">
                {premiumState.isPremium ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <h3 className="text-lg font-medium text-foreground">
                  {premiumState.isPremium ? "Premium Active" : "No Premium Plan"}
                </h3>
              </div>

              {/* Content Creator Status */}
              <div className="flex items-center justify-center mb-4">
                {premiumState.isContentCreatorPremium ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <h3 className="text-lg font-medium text-foreground">
                  {premiumState.isContentCreatorPremium 
                    ? "Content Creator Premium Active" 
                    : "No Content Creator Plan"}
                </h3>
              </div>

              {/* Expiry Information */}
              {(premiumState.premiumExpiresAt || premiumState.contentCreatorExpiresAt) && (
                <div className="text-sm text-muted-foreground mb-4">
                  {premiumState.premiumExpiresAt && (
                    <p>Premium expires: {new Date(premiumState.premiumExpiresAt).toLocaleDateString()}</p>
                  )}
                  {premiumState.contentCreatorExpiresAt && (
                    <p>Creator plan expires: {new Date(premiumState.contentCreatorExpiresAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              <p className="text-muted-foreground text-sm mb-4">
                {premiumState.isPremium || premiumState.isContentCreatorPremium
                  ? "Enjoy enhanced features and higher earnings with your premium plans"
                  : "Upgrade to premium to enjoy better features and higher earnings"}
              </p>

              <div className="flex gap-2 justify-center">
                <Button
                  className="teal-button"
                  onClick={() => navigate("/upgrade-premium")}
                  disabled={premiumState.isLoading}
                >
                  {premiumState.isPremium ? "Manage Premium" : "Upgrade Premium"}
                </Button>
                <Button
                  className="teal-button"
                  onClick={() => navigate("/upgrade-content-premium")}
                  disabled={premiumState.isLoading}
                >
                  {premiumState.isContentCreatorPremium ? "Manage Creator" : "Upgrade Creator"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="max-w-screen-md mx-auto p-4 mt-4">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
              >
                <div className="flex items-center">
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-3",
                    transaction.status === 'completed' && "bg-green-500",
                    transaction.status === 'pending' && "bg-yellow-500",
                    transaction.status === 'failed' && "bg-red-500"
                  )} />
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-medium",
                    (transaction.type === 'deposit' || transaction.type === 'earning') && "text-green-600",
                    (transaction.type === 'withdrawal' || transaction.type === 'subscription') && "text-red-600"
                  )}>
                    {(transaction.type === 'deposit' || transaction.type === 'earning') ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal Tab */}
      <div className="max-w-screen-md mx-auto p-4 mt-4">
        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid grid-cols-1 w-full mb-4 bg-muted">
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-foreground">Withdraw to</h3>

              <div className="space-y-3 mb-6">
                {["PayTM", "PhonePe", "Bank Transfer", "UPI"].map((method) => (
                  <div
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    className={cn(
                      "border rounded-lg p-4 flex items-center cursor-pointer transition-colors",
                      selectedMethod === method
                        ? "border-adtip-teal bg-adtip-teal/5"
                        : "border-border hover:border-adtip-teal/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center text-white font-bold",
                        method === "PayTM" && "bg-blue-500",
                        method === "PhonePe" && "bg-purple-500",
                        method === "Bank Transfer" && "bg-green-500",
                        method === "UPI" && "bg-orange-500"
                      )}
                    >
                      {method[0]}
                    </div>
                    <div className="ml-3 text-foreground">{method}</div>
                    <div className="ml-auto">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center",
                          selectedMethod === method
                            ? "border-adtip-teal"
                            : "border-gray-300"
                        )}
                      >
                        {selectedMethod === method && (
                          <div className="w-3 h-3 rounded-full bg-adtip-teal"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold mb-4 text-foreground">Enter amount</h3>
              <div className="relative mb-6">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="50"
                  max={walletState.balance}
                  className="w-full px-8 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-adtip-teal"
                />
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={
                  !selectedMethod ||
                  !withdrawAmount ||
                  Number(withdrawAmount) < 50 ||
                  Number(withdrawAmount) > walletState.balance ||
                  walletState.isLoading
                }
                className="teal-button w-full"
              >
                Withdraw {withdrawAmount && formatCurrency(Number(withdrawAmount))}
              </Button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Minimum withdrawal amount: ₹50 • Available: {formatCurrency(walletState.balance)}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedWallet;