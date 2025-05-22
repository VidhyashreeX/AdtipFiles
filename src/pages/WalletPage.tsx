
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const WalletPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState(1000.00);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<string | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'withdraw' | 'bank'>('main');
  
  // Mock transaction data
  const transactions = [
    { id: 1, merchant: 'Amazon', date: 'May 24, 2022', amount: 3.56, type: 'credit' },
    { id: 2, merchant: 'McDonalds', date: 'May 12, 2022', amount: 3.56, type: 'credit' },
    { id: 3, merchant: 'Apple', date: 'May 8, 2022', amount: 3.56, type: 'debit' },
    { id: 4, merchant: 'Starbucks', date: 'May 6, 2022', amount: 3.56, type: 'credit' },
  ];
  
  const handleWithdraw = () => {
    if (!withdrawMethod) {
      toast({
        description: "Please select a withdrawal method",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }
    
    if (amount > balance) {
      toast({
        description: "Insufficient balance for withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    // Process withdrawal
    setBalance(prev => prev - amount);
    toast({
      title: "Withdrawal Successful",
      description: `₹${amount} has been withdrawn to your ${withdrawMethod} account`
    });
    setWithdrawAmount('');
    setWithdrawMethod(null);
    setCurrentView('main');
  };

  const renderWithdrawView = () => (
    <>
      <div className="flex items-center mb-6">
        <button onClick={() => setCurrentView('main')} className="mr-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Cash Withdrawal</h1>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-500">₹</span>
            </div>
            <span className="text-gray-500">Current balance</span>
          </div>
          <span className="text-xl font-bold">₹{balance.toFixed(2)}</span>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-500 mb-2">Enter the amount you want to withdraw</p>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 flex items-center justify-center">
              <span className="mr-2">₹</span>
              <Input 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-4xl font-bold border-none text-center max-w-[200px]"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-500 mb-2">This amount will go to your Phonepe *65</p>
          <p className="text-gray-400 text-sm">5% charges will be applicable for withdrawal</p>
        </div>
        
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
          onClick={() => setCurrentView('bank')}
        >
          WITHDRAW ₹{withdrawAmount || '0.00'}
        </Button>
        
        <div className="grid grid-cols-3 gap-2 mt-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-16 text-lg"
              onClick={() => setWithdrawAmount(prev => prev + num)}
            >
              {num}
              {num === 2 && <div className="text-xs text-gray-400">ABC</div>}
              {num === 3 && <div className="text-xs text-gray-400">DEF</div>}
              {num === 4 && <div className="text-xs text-gray-400">GHI</div>}
              {num === 5 && <div className="text-xs text-gray-400">JKL</div>}
              {num === 6 && <div className="text-xs text-gray-400">MNO</div>}
              {num === 7 && <div className="text-xs text-gray-400">PQRS</div>}
              {num === 8 && <div className="text-xs text-gray-400">TUV</div>}
              {num === 9 && <div className="text-xs text-gray-400">WXYZ</div>}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-16 text-lg"
          >
            .
          </Button>
          <Button
            variant="outline"
            className="h-16 text-lg"
            onClick={() => setWithdrawAmount('0')}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-16 text-lg"
            onClick={() => setWithdrawAmount(prev => prev.slice(0, -1))}
          >
            ←
          </Button>
        </div>
      </div>
    </>
  );

  const renderBankAccountView = () => (
    <>
      <div className="flex items-center mb-6">
        <button onClick={() => setCurrentView('withdraw')} className="mr-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Bank Account</h1>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-1">
          <label className="text-sm text-gray-500">Account Name</label>
          <div className="p-3 bg-gray-100 rounded">
            Ex: Mahesh Babu
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm text-gray-500">Account Number</label>
          <div className="p-3 border rounded">
            ****6293854451456
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm text-gray-500">Branch</label>
          <div className="p-3 border rounded">
            Place
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm text-gray-500">IFSC</label>
          <div className="p-3 bg-gray-100 rounded">
            Ex: IBKL0000
          </div>
        </div>
        
        <Button
          className="w-full mt-6"
          onClick={handleWithdraw}
        >
          Confirm & Withdraw
        </Button>
      </div>
    </>
  );

  const renderMainView = () => (
    <>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">My Wallet</h1>
      </div>

      <Card className="bg-gradient-to-r from-orange-400 to-red-400 text-white mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-sm mb-1">Total Balance</p>
          <h2 className="text-4xl font-bold mb-4">₹{balance.toFixed(2)}</h2>
          <div className="inline-block bg-white text-black px-3 py-1 rounded text-sm">
            INR
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button 
              variant="ghost" 
              className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              onClick={() => setCurrentView('withdraw')}
            >
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between mb-6">
        <Button variant="destructive" className="w-[48%]">
          Out of funds
        </Button>
        <Button className="w-[48%] bg-orange-500 hover:bg-orange-600">
          Add funds ₹
        </Button>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                  {tx.merchant[0]}
                </div>
                <div>
                  <div className="font-medium">{tx.merchant}</div>
                  <div className="text-xs text-gray-500">{tx.date}</div>
                </div>
              </div>
              <div className={tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}>
                {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      {currentView === 'main' && renderMainView()}
      {currentView === 'withdraw' && renderWithdrawView()}
      {currentView === 'bank' && renderBankAccountView()}
    </div>
  );
};

export default WalletPage;
