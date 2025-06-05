import React, {createContext, useContext, ReactNode} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface TabNavigatorContextType {
  tabBarHeight: number;
  bottomInset: number;
  contentPaddingBottom: number;
}

const TabNavigatorContext = createContext<TabNavigatorContextType | undefined>(undefined);

interface TabNavigatorProviderProps {
  children: ReactNode;
}

export const TabNavigatorProvider: React.FC<TabNavigatorProviderProps> = ({children}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate the tab bar height (standard height + bottom insets, capped at a reasonable value)
  const tabBarHeight = 60 + Math.min(insets.bottom, 20);
  const bottomInset = insets.bottom;
  
  // Content padding should account for the tab bar height to prevent overlap
  const contentPaddingBottom = tabBarHeight + 16; // 16px additional spacing

  const value: TabNavigatorContextType = {
    tabBarHeight,
    bottomInset,
    contentPaddingBottom,
  };

  return (
    <TabNavigatorContext.Provider value={value}>
      {children}
    </TabNavigatorContext.Provider>
  );
};

export const useTabNavigator = (): TabNavigatorContextType => {
  const context = useContext(TabNavigatorContext);
  if (context === undefined) {
    throw new Error('useTabNavigator must be used within a TabNavigatorProvider');
  }
  return context;
};
