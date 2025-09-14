import { useState, useEffect, useCallback } from 'react';
import { premiumService } from '@/services/premiumService';

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

interface UsePremiumStatusReturn {
  userPremium: PremiumStatus | null;
  contentCreatorPremium: ContentCreatorPremium | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPremium: boolean;
  isContentCreator: boolean;
}

export const usePremiumStatus = (userId?: string): UsePremiumStatusReturn => {
  const [userPremium, setUserPremium] = useState<PremiumStatus | null>(null);
  const [contentCreatorPremium, setContentCreatorPremium] = useState<ContentCreatorPremium | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPremiumStatus = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch both premium statuses in parallel
      const [userPremiumData, contentCreatorData] = await Promise.all([
        premiumService.checkPremiumStatus(userId),
        premiumService.checkContentCreatorPremium(userId)
      ]);

      setUserPremium(userPremiumData);
      setContentCreatorPremium(contentCreatorData);

    } catch (err) {
      console.error('❌ [Premium Hook] Error fetching premium status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch premium status');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  const refetch = useCallback(async () => {
    await fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  const isPremium = userPremium?.is_premium || false;
  const isContentCreator = contentCreatorPremium?.is_content_creator || false;

  return {
    userPremium,
    contentCreatorPremium,
    loading,
    error,
    refetch,
    isPremium,
    isContentCreator
  };
};

export default usePremiumStatus;
