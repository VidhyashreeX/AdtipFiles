/**
 * CPX Research Context
 * 
 * Provides a way for components to trigger the CPX Research modal
 * that's rendered at the root level of the screen.
 */

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import Logger from '../utils/logger';

interface CPXResearchContextType {
  openSurveyModal: () => void;
  fetchSurveysAndTransactions: () => void;
  markTransactionAsPaid: (transactionId: string, messageId: string) => void;
  bindOpenWebView: (fn: any) => void;
  bindFetchSurveysAndTransactions: (fn: any) => void;
  bindMarkTransactionAsPaid: (fn: any) => void;
}

const CPXResearchContext = createContext<CPXResearchContextType | null>(null);

export const CPXResearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const openWebViewRef = useRef<any>(null);
  const fetchSurveysAndTransactionsRef = useRef<any>(null);
  const markTransactionAsPaidRef = useRef<any>(null);

  const openSurveyModal = () => {
    if (openWebViewRef.current) {
      Logger.info('CPXResearchContext', 'Opening survey modal');
      openWebViewRef.current();
    } else {
      Logger.warn('CPXResearchContext', 'Survey modal not available');
    }
  };

  const fetchSurveysAndTransactions = () => {
    if (fetchSurveysAndTransactionsRef.current) {
      Logger.info('CPXResearchContext', 'Fetching surveys and transactions');
      fetchSurveysAndTransactionsRef.current();
    } else {
      Logger.warn('CPXResearchContext', 'Fetch function not available');
    }
  };

  const markTransactionAsPaid = (transactionId: string, messageId: string) => {
    if (markTransactionAsPaidRef.current) {
      Logger.info('CPXResearchContext', 'Marking transaction as paid', { transactionId, messageId });
      markTransactionAsPaidRef.current(transactionId, messageId);
    } else {
      Logger.warn('CPXResearchContext', 'Mark transaction function not available');
    }
  };

  const bindOpenWebView = (fn: any) => {
    openWebViewRef.current = fn;
    Logger.info('CPXResearchContext', 'bindOpenWebView called');
  };

  const bindFetchSurveysAndTransactions = (fn: any) => {
    fetchSurveysAndTransactionsRef.current = fn;
    Logger.info('CPXResearchContext', 'bindFetchSurveysAndTransactions called');
  };

  const bindMarkTransactionAsPaid = (fn: any) => {
    markTransactionAsPaidRef.current = fn;
    Logger.info('CPXResearchContext', 'bindMarkTransactionAsPaid called');
  };

  const contextValue: CPXResearchContextType = {
    openSurveyModal,
    fetchSurveysAndTransactions,
    markTransactionAsPaid,
    bindOpenWebView,
    bindFetchSurveysAndTransactions,
    bindMarkTransactionAsPaid,
  };

  return (
    <CPXResearchContext.Provider value={contextValue}>
      {children}
    </CPXResearchContext.Provider>
  );
};

export const useCPXResearch = (): CPXResearchContextType => {
  const context = useContext(CPXResearchContext);
  if (!context) {
    throw new Error('useCPXResearch must be used within a CPXResearchProvider');
  }
  return context;
};

// Safe hook that returns null if context is not available
export const useCPXResearchSafe = (): CPXResearchContextType | null => {
  const context = useContext(CPXResearchContext);
  return context;
};

export default CPXResearchContext;
