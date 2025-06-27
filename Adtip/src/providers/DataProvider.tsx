// src/providers/DataProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { CacheManager } from '../hooks/useQueries';

interface DataContextType {
  clearCache: (pattern?: string) => void;
  invalidateData: (keys: string[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const clearCache = (pattern?: string) => {
    CacheManager.clear(pattern);
  };

  const invalidateData = (keys: string[]) => {
    keys.forEach(key => CacheManager.clear(key));
  };

  const value: DataContextType = {
    clearCache,
    invalidateData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
