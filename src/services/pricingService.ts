import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

export interface PricingCalculation {
  perViewPrice: number;
  totalBudget: number;
  expectedViews: number;
  platformFee: number;
  creatorEarnings: number;
  totalEarnings: number;
}

export interface PricingSuggestion {
  contentType: 'video' | 'short' | 'post';
  suggestedPerViewPrice: number;
  minPrice: number;
  maxPrice: number;
  reason: string;
}

export interface PricingHistory {
  id: string;
  contentId: string;
  perViewPrice: number;
  totalBudget: number;
  expectedViews: number;
  actualViews: number;
  totalEarnings: number;
  creatorEarnings: number;
  createdAt: string;
}

export interface DefaultPricing {
  defaultPerViewPrice: number;
  defaultExpectedViews: number;
  platformFeePercentage: number;
  minPerViewPrice: number;
  maxPerViewPrice: number;
}

class PricingService {
  private getAuthToken(): string | null {
    try {
      const token = localStorage.getItem('UserLoggedIn');
      return token ? `Bearer ${token}` : null;
    } catch {
      return null;
    }
  }

  private async makeRequest(endpoint: string, data?: any, method: 'GET' | 'POST' = 'GET') {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
        headers: {
        'Authorization': token,
          'Content-Type': 'application/json',
      },
      ...(data && { data }),
    };

    const response = await axios(config);
    return response.data;
  }

  /**
   * Calculate pricing for promotional content
   */
  async calculatePricing(data: {
    contentType: 'video' | 'short' | 'post';
    perViewPrice?: number;
    totalBudget?: number;
    expectedViews?: number;
    creatorId?: number;
  }): Promise<PricingCalculation> {
    try {
      const result = await this.makeRequest('/api/pricing/calculate', data, 'POST');
      return result.data;
    } catch (error) {
      console.error('❌ [Pricing] Error calculating pricing:', error);
      throw error;
    }
  }

  /**
   * Get pricing suggestions based on content type and creator performance
   */
  async getPricingSuggestions(creatorId: number): Promise<PricingSuggestion[]> {
    try {
      const result = await this.makeRequest(`/api/pricing/suggestions?creatorId=${creatorId}`);
      return result.data;
    } catch (error) {
      console.error('❌ [Pricing] Error getting suggestions:', error);
      throw error;
    }
  }

  /**
   * Get pricing history for a creator
   */
  async getPricingHistory(creatorId: number): Promise<PricingHistory[]> {
    try {
      const result = await this.makeRequest(`/api/pricing/history/${creatorId}`);
      return result.data;
    } catch (error) {
      console.error('❌ [Pricing] Error getting history:', error);
      throw error;
    }
  }

  /**
   * Get default pricing configuration
   */
  async getDefaultPricing(): Promise<DefaultPricing> {
    try {
      const result = await this.makeRequest('/api/pricing/default');
      return result.data;
    } catch (error) {
      console.error('❌ [Pricing] Error getting default pricing:', error);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }
}

export const pricingService = new PricingService();
export default pricingService;
