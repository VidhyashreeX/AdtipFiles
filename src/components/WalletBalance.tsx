import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";

interface WalletBalanceProps {
  className?: string;
}

const WalletBalance = ({ className = "" }: WalletBalanceProps) => {
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id || null;
  const token = user?.accessToken || null;

  const fetchWalletBalance = async () => {
    if (!isAuthenticated || !userId || !token) {
      return;
    }

    try {
      const response = await userAPI.getWalletBalance(String(userId));

      if (response.data.status === 200) {
        setWalletBalance(response.data.availableBalance);
      } else {
        throw new Error(response.data.message || "Failed to fetch wallet balance");
      }
    } catch (err: unknown) {
      const axiosError = err as any;
      if (axiosError.name === "AbortError") return;
      console.error("getfunds error:", {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
      setWalletBalance(null);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, [isAuthenticated, userId, token]);

  if (!isAuthenticated || !walletBalance) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium ${className}`}>
      <span className="text-green-600">₹</span>
      <span>{walletBalance}</span>
    </div>
  );
};

export default WalletBalance;