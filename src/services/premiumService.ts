import axios from 'axios';

// Configuration
const localhostUrl = import.meta.env.VITE_API_URL || 'http://localhost:7082';

interface PremiumStatus {
  is_premium: boolean;
  premium_plan_id: number;
  premium_expires_at?: string;
  premium_plan_name?: string;
}

interface ContentCreatorPremium {
  is_content_creator: boolean;
  content_creator_plan_id: number;
  content_creator_expires_at?: string;
  content_creator_plan_name?: string;
}

class PremiumService {
  private getAuthToken(): string | null {
    return localStorage.getItem('UserLoggedIn');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${localhostUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Premium service error:', error);
      throw error;
    }
  }

  async checkPremiumStatus(userId: string): Promise<PremiumStatus | null> {
    try {
      const response = await this.makeRequest(`/api/user-premium-status/${userId}`);
      
      if (response && response.status) {
        // Handle different response structures
        const data = response.data || response;

        // Normalize fields from multiple backend shapes
        const normalizedExpires = data.premium_expires_at || data.current_end_at;

        // Determine premium boolean robustly
        let normalizedIsPremium: boolean = false;
        if (typeof data.is_premium === 'boolean') {
          normalizedIsPremium = data.is_premium;
        }
        // Fallback heuristics when API returns different shape
        if (!normalizedIsPremium) {
          const statusActive = data.status === true || data.status === 'active';
          const hasPlan = (typeof data.premium_plan_id === 'number' && data.premium_plan_id > 0);
          const hasPaid = typeof data.paid_count === 'number' && data.paid_count > 0;
          const msgPremium = typeof data.message === 'string' && data.message.toLowerCase().includes('premium');
          if (statusActive || hasPlan || hasPaid || msgPremium) {
            normalizedIsPremium = true;
          }
        }

        const normalizedPlanId = (typeof data.premium_plan_id === 'number' && data.premium_plan_id > 0)
          ? data.premium_plan_id
          : (typeof data.paid_count === 'number' && data.paid_count > 0 ? 1 : 0);
        const normalizedPlanName = data.premium_plan_name || data.razorpay_plan_id;

        const premiumStatus: PremiumStatus = {
          is_premium: normalizedIsPremium,
          premium_plan_id: normalizedPlanId,
          premium_expires_at: normalizedExpires,
          premium_plan_name: normalizedPlanName
        };
        
        return premiumStatus;
      }
      
      throw new Error('Invalid response from premium status API');
    } catch (error) {
      console.error('❌ [Premium] Error checking premium status:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async checkContentCreatorPremium(userId: string): Promise<ContentCreatorPremium | null> {
    try {
      const response = await this.makeRequest(`/api/content-premium/status/${userId}`);
      
      if (response && response.status) {
        // Handle different response structures
        const data = response.data || response;

        // Normalize content-creator fields
        const statusActive = data.status === true || data.status === 'active';
        const hasCreatorFlag = typeof data.is_content_creator === 'boolean' ? data.is_content_creator : false;
        const hasPaid = typeof data.paid_count === 'number' && data.paid_count > 0;

        const normalizedIsCreator = hasCreatorFlag || statusActive || hasPaid;
        const normalizedPlanId = (typeof data.content_creator_plan_id === 'number' && data.content_creator_plan_id > 0)
          ? data.content_creator_plan_id
          : (hasPaid || statusActive ? 1 : 0);
        const normalizedExpires = data.content_creator_expires_at || data.current_end_at;
        const normalizedPlanName = data.content_creator_plan_name || data.razorpay_plan_id;

        const contentCreatorPremium: ContentCreatorPremium = {
          is_content_creator: normalizedIsCreator,
          content_creator_plan_id: normalizedPlanId,
          content_creator_expires_at: normalizedExpires,
          content_creator_plan_name: normalizedPlanName
        };
        
        return contentCreatorPremium;
      }
      
      throw new Error('Invalid response from content creator premium API');
    } catch (error) {
      console.error('❌ [Premium] Error checking content creator premium:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getPremiumPlans(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/premium-plans');
      
      if (response && response.status && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Premium Plans] Error fetching plans:', error);
      return [];
    }
  }

  async getContentCreatorPlans(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/content-creator-plans');
      
      if (response && response.status && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Content Creator Plans] Error fetching plans:', error);
      return [];
    }
  }

  async subscribeToPremium(planId: number, paymentMethod: string): Promise<any> {
    try {
      const response = await this.makeRequest('/premium/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          payment_method: paymentMethod
        })
      });
      
      if (response && response.status) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Premium Subscription] Error:', error);
      return null;
    }
  }

  async subscribeToContentCreator(planId: number, paymentMethod: string): Promise<any> {
    try {
      console.log('🔍 [Content Creator Subscription] Subscribing to plan:', planId);
      
      const response = await this.makeRequest('/content-creator/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          payment_method: paymentMethod
        })
      });
      
      if (response && response.status) {
        console.log('✅ [Content Creator Subscription] Subscription successful');
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Content Creator Subscription] Error:', error);
      return null;
    }
  }

  async cancelPremiumSubscription(): Promise<boolean> {
    try {
      console.log('🔍 [Premium Cancellation] Cancelling premium subscription');
      
      const response = await this.makeRequest('/premium/cancel', {
        method: 'POST'
      });
      
      if (response && response.status) {
        console.log('✅ [Premium Cancellation] Subscription cancelled');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Premium Cancellation] Error:', error);
      return false;
    }
  }

  async cancelContentCreatorSubscription(): Promise<boolean> {
    try {
      console.log('🔍 [Content Creator Cancellation] Cancelling content creator subscription');
      
      const response = await this.makeRequest('/content-creator/cancel', {
        method: 'POST'
      });
      
      if (response && response.status) {
        console.log('✅ [Content Creator Cancellation] Subscription cancelled');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Content Creator Cancellation] Error:', error);
      return false;
    }
  }

  async getSubscriptionHistory(): Promise<any[]> {
    try {
      console.log('🔍 [Subscription History] Fetching subscription history');
      
      const response = await this.makeRequest('/subscription/history');
      
      if (response && response.status && response.data) {
        console.log('✅ [Subscription History] History loaded:', response.data.length);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Subscription History] Error fetching history:', error);
      return [];
    }
  }

  async getBillingInfo(): Promise<any> {
    try {
      console.log('🔍 [Billing Info] Fetching billing information');
      
      const response = await this.makeRequest('/billing/info');
      
      if (response && response.status) {
        console.log('✅ [Billing Info] Billing info loaded');
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Billing Info] Error fetching billing info:', error);
      return null;
    }
  }

  async updateBillingInfo(billingInfo: any): Promise<boolean> {
    try {
      console.log('🔍 [Billing Update] Updating billing information');
      
      const response = await this.makeRequest('/billing/update', {
        method: 'POST',
        body: JSON.stringify(billingInfo)
      });
      
      if (response && response.status) {
        console.log('✅ [Billing Update] Billing info updated');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Billing Update] Error updating billing info:', error);
      return false;
    }
  }

  async getPaymentMethods(): Promise<any[]> {
    try {
      console.log('🔍 [Payment Methods] Fetching payment methods');
      
      const response = await this.makeRequest('/payment-methods');
      
      if (response && response.status && response.data) {
        console.log('✅ [Payment Methods] Payment methods loaded:', response.data.length);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Payment Methods] Error fetching payment methods:', error);
      return [];
    }
  }

  async addPaymentMethod(paymentMethod: any): Promise<boolean> {
    try {
      console.log('🔍 [Payment Method] Adding payment method');
      
      const response = await this.makeRequest('/payment-methods/add', {
        method: 'POST',
        body: JSON.stringify(paymentMethod)
      });
      
      if (response && response.status) {
        console.log('✅ [Payment Method] Payment method added');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Payment Method] Error adding payment method:', error);
      return false;
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      console.log('🔍 [Payment Method] Removing payment method:', paymentMethodId);
      
      const response = await this.makeRequest(`/payment-methods/${paymentMethodId}/remove`, {
        method: 'DELETE'
      });
      
      if (response && response.status) {
        console.log('✅ [Payment Method] Payment method removed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Payment Method] Error removing payment method:', error);
      return false;
    }
  }
}

export const premiumService = new PremiumService();
export default premiumService;
