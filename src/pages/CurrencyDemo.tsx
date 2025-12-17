import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  formatCurrency, 
  convertCurrency, 
  Currency,
  getCurrencySymbol,
  getCurrencyName,
  EXCHANGE_RATES
} from "../utils/currencyUtils";

const CurrencyDemo: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('INR');

  const currencies: Currency[] = ['INR', 'USD', 'EUR', 'GBP'];

  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white">
        <div className="max-w-screen-md mx-auto p-6">
          <div className="flex items-center mb-4">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold ml-2">Currency Conversion Demo</h1>
          </div>
          <p className="text-white/80 text-sm">
            Test the enhanced currency conversion system with proper exchange rates
          </p>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-6">
        {/* Currency Converter */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Currency Converter</h2>
          
          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-adtip-teal"
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
            {/* From Currency */}
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-adtip-teal"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {getCurrencySymbol(currency)} {currency} - {getCurrencyName(currency)}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                onClick={swapCurrencies}
                variant="outline"
                size="sm"
                className="p-2"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* To Currency */}
            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-adtip-teal"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {getCurrencySymbol(currency)} {currency} - {getCurrencyName(currency)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversion Result */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-adtip-teal mb-2">
                {formatCurrency(amount, fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
              </div>
              <div className="text-sm text-muted-foreground">
                Exchange Rate: 1 {fromCurrency} = {convertCurrency(1, fromCurrency, toCurrency).toFixed(4)} {toCurrency}
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rates Table */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Exchange Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(EXCHANGE_RATES).map(([rateKey, rate]) => (
              <div key={rateKey} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">{rateKey.replace('_TO_', ' → ')}</span>
                <span className="text-adtip-teal font-bold">{rate.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Conversions */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sample Conversions</h2>
          <div className="space-y-3">
            {[
              { amount: 100, from: 'USD' as Currency, to: 'INR' as Currency },
              { amount: 1000, from: 'INR' as Currency, to: 'USD' as Currency },
              { amount: 50, from: 'EUR' as Currency, to: 'INR' as Currency },
              { amount: 25, from: 'GBP' as Currency, to: 'USD' as Currency },
            ].map((sample, index) => {
              const converted = convertCurrency(sample.amount, sample.from, sample.to);
              return (
                <div key={index} className="flex justify-between items-center p-3 border border-border rounded-lg">
                  <span>{formatCurrency(sample.amount, sample.from)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-adtip-teal">{formatCurrency(converted, sample.to)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Different Amounts */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[10, 50, 100, 500, 1000, 5000, 10000, 50000].map((testAmount) => (
            <Button
              key={testAmount}
              onClick={() => setAmount(testAmount)}
              variant={amount === testAmount ? "default" : "outline"}
              className="text-sm"
            >
              {formatCurrency(testAmount, 'INR')}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyDemo;