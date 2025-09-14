import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Users, DollarSign, Info } from 'lucide-react';
import { pricingService, PricingCalculation, DefaultPricing } from '@/services/pricingService';

interface PricingCalculatorProps {
  onPricingCalculated?: (pricing: PricingCalculation) => void;
  initialData?: {
    contentType?: 'video' | 'short' | 'post';
    perViewPrice?: number;
    totalBudget?: number;
    expectedViews?: number;
  };
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  onPricingCalculated,
  initialData = {}
}) => {
  const [contentType, setContentType] = useState<'video' | 'short' | 'post'>(initialData.contentType || 'video');
  const [pricingMode, setPricingMode] = useState<'perView' | 'budget'>('perView');
  const [perViewPrice, setPerViewPrice] = useState<number>(initialData.perViewPrice || 0.01);
  const [totalBudget, setTotalBudget] = useState<number>(initialData.totalBudget || 1000);
  const [expectedViews, setExpectedViews] = useState<number>(initialData.expectedViews || 100000);
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [defaultPricing, setDefaultPricing] = useState<DefaultPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load default pricing on mount
  useEffect(() => {
  const loadDefaultPricing = async () => {
    try {
      const pricing = await pricingService.getDefaultPricing();
      setDefaultPricing(pricing);
        setPerViewPrice(pricing.defaultPerViewPrice);
        setExpectedViews(pricing.defaultExpectedViews);
      } catch (err) {
        console.error('Failed to load default pricing:', err);
      }
    };

    loadDefaultPricing();
  }, []);

  const calculatePricing = async () => {
    if (pricingMode === 'perView' && perViewPrice <= 0) {
      setError('Please enter a valid per-view price');
      return;
    }

    if (pricingMode === 'budget' && (totalBudget <= 0 || expectedViews <= 0)) {
      setError('Please enter valid budget and expected views');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        contentType,
        ...(pricingMode === 'perView' 
          ? { perViewPrice, expectedViews }
          : { totalBudget, expectedViews }
        ),
        creatorId: parseInt(localStorage.getItem('UserId') || '0')
      };

      const result = await pricingService.calculatePricing(data);
      setCalculation(result);
      onPricingCalculated?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: 'perView' | 'budget') => {
    setPricingMode(mode);
    setCalculation(null);
    setError(null);
  };

  return (
    <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-adtip-teal">
            <Calculator className="w-5 h-5" />
            Pricing Calculator
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="contentType">Content Type</Label>
          <Select value={contentType} onValueChange={(value: 'video' | 'short' | 'post') => setContentType(value)}>
                <SelectTrigger>
              <SelectValue />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="video">Video (TipTube)</SelectItem>
              <SelectItem value="short">Short (TipShorts)</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                </SelectContent>
              </Select>
            </div>

        {/* Pricing Mode Selection */}
        <div className="space-y-2">
          <Label>Pricing Mode</Label>
          <div className="flex gap-2">
            <Button
              variant={pricingMode === 'perView' ? 'default' : 'outline'}
              onClick={() => handleModeChange('perView')}
              className="flex-1"
            >
              Per-View Price
            </Button>
            <Button
              variant={pricingMode === 'budget' ? 'default' : 'outline'}
              onClick={() => handleModeChange('budget')}
              className="flex-1"
            >
              Total Budget
            </Button>
          </div>
          </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricingMode === 'perView' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="perViewPrice">Per-View Price (₹)</Label>
              <Input
                  id="perViewPrice"
                type="number"
                  step="0.01"
                  min="0"
                  value={perViewPrice}
                  onChange={(e) => setPerViewPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.01"
              />
                {defaultPricing && (
                  <p className="text-xs text-gray-500">
                    Default: {pricingService.formatCurrency(defaultPricing.defaultPerViewPrice)} per view
              </p>
                )}
            </div>
              <div className="space-y-2">
                <Label htmlFor="expectedViews">Expected Views</Label>
                <Input
                  id="expectedViews"
                  type="number"
                  value={expectedViews}
                  onChange={(e) => setExpectedViews(parseInt(e.target.value) || 0)}
                  placeholder="100000"
                />
                {defaultPricing && (
                  <p className="text-xs text-gray-500">
                    Default: {pricingService.formatNumber(defaultPricing.defaultExpectedViews)} views
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Budget (₹)</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedViews">Expected Views</Label>
                <Input
                  id="expectedViews"
                  type="number"
                  value={expectedViews}
                  onChange={(e) => setExpectedViews(parseInt(e.target.value) || 0)}
                  placeholder="100000"
                />
              </div>
            </>
          )}
          </div>

        {/* Calculate Button */}
          <Button 
            onClick={calculatePricing} 
            disabled={loading}
            className="w-full bg-adtip-teal hover:bg-adtip-teal/90 text-white"
          >
          {loading ? 'Calculating...' : 'Calculate Pricing'}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {calculation && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 text-adtip-teal">Pricing Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Per-View Price</span>
                    <span className="font-semibold text-blue-600">
                      {pricingService.formatCurrency(calculation.perViewPrice)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Expected Views</span>
                    <span className="font-semibold text-green-600">
                      {pricingService.formatNumber(calculation.expectedViews)}
                    </span>
                </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Budget</span>
                    <span className="font-semibold text-purple-600">
                      {pricingService.formatCurrency(calculation.totalBudget)}
                    </span>
            </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Platform Fee (10%)</span>
                    <span className="font-semibold text-orange-600">
                      {pricingService.formatCurrency(calculation.platformFee)}
                    </span>
              </div>

                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Creator Earnings (90%)</span>
                    <span className="font-semibold text-emerald-600">
                      {pricingService.formatCurrency(calculation.creatorEarnings)}
                    </span>
                </div>

                  <div className="flex justify-between items-center p-3 bg-adtip-teal/10 rounded-lg border border-adtip-teal/20">
                    <span className="text-sm font-medium text-gray-700">Total Earnings</span>
                    <span className="font-semibold text-adtip-teal text-lg">
                      {pricingService.formatCurrency(calculation.totalEarnings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Per-View Mode:</strong> Set your desired price per view</li>
                <li>• <strong>Budget Mode:</strong> Set total budget, price calculated automatically</li>
                <li>• <strong>Platform Fee:</strong> 10% of total earnings</li>
                <li>• <strong>Creator Earnings:</strong> 90% of total earnings</li>
              </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  );
};

export default PricingCalculator;
