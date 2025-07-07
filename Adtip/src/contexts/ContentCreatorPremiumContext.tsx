import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import ApiService from '../services/ApiService';

interface ContentCreatorPremiumContextType {
  isContentCreatorPremium: boolean;
  contentCreatorPremiumData: any;
  refreshContentCreatorPremiumStatus: () => Promise<void>;
  isLoading: boolean;
}

const defaultContext: ContentCreatorPremiumContextType = {
  isContentCreatorPremium: false,
  contentCreatorPremiumData: null,
  refreshContentCreatorPremiumStatus: async () => {},
  isLoading: false,
};

export const ContentCreatorPremiumContext = createContext<ContentCreatorPremiumContextType>(defaultContext);

export const useContentCreatorPremium = () => useContext(ContentCreatorPremiumContext);

interface ContentCreatorPremiumProviderProps {
  children: ReactNode;
}

export const ContentCreatorPremiumProvider: React.FC<ContentCreatorPremiumProviderProps> = ({ children }) => {
  const [isContentCreatorPremium, setIsContentCreatorPremium] = useState<boolean>(false);
  const [contentCreatorPremiumData, setContentCreatorPremiumData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const refreshContentCreatorPremiumStatus = useCallback(async () => {
    console.log('🔄 [ContentCreatorPremiumContext] Refreshing content creator premium status for user:', user?.id);
    
    if (!user?.id) {
      console.log('❌ [ContentCreatorPremiumContext] No user or user ID available');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📡 [ContentCreatorPremiumContext] Fetching content creator premium status...');
      
      const response = await ApiService.getContentPremiumStatus(user.id);
      console.log('📥 [ContentCreatorPremiumContext] Content creator premium API response:', {
        status: response.status,
        hasData: !!response.data,
        data: response.data,
        message: response.message
      });
      
      if (response.status && response.data) {
        const isPremium = response.data.is_active === true;
        console.log('✅ [ContentCreatorPremiumContext] User has active content creator premium:', {
          isPremium,
          planName: response.data.plan_name,
          amount: response.data.amount,
          status: response.data.status
        });
        
        setIsContentCreatorPremium(isPremium);
        setContentCreatorPremiumData(isPremium ? response.data : null);
      } else {
        console.log('❌ [ContentCreatorPremiumContext] No content creator premium subscription found');
        setIsContentCreatorPremium(false);
        setContentCreatorPremiumData(null);
      }
    } catch (error: any) {
      console.error('❌ [ContentCreatorPremiumContext] Error fetching content creator premium status:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      setIsContentCreatorPremium(false);
      setContentCreatorPremiumData(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 [ContentCreatorPremiumContext] Content creator premium status refresh completed');
    }
  }, [user?.id]);

  // Automatically refresh status on mount and when user changes
  useEffect(() => {
    refreshContentCreatorPremiumStatus();
  }, [refreshContentCreatorPremiumStatus]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isContentCreatorPremium,
    contentCreatorPremiumData,
    refreshContentCreatorPremiumStatus,
    isLoading,
  }), [isContentCreatorPremium, contentCreatorPremiumData, refreshContentCreatorPremiumStatus, isLoading]);

  return (
    <ContentCreatorPremiumContext.Provider value={contextValue}>
      {children}
    </ContentCreatorPremiumContext.Provider>
  );
}; 