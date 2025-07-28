// src/hooks/useNavigationMachine.ts
import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { navigationMachine, getNavigatorComponent } from '../machines/navigationMachine';
import { useAuth } from '../contexts/AuthContext';
import { Logger } from '../utils/ProductionLogger';

export const useNavigationMachine = () => {
  const [state, send] = useMachine(navigationMachine);
  const { isAuthenticated, isGuest, user, isInitialized } = useAuth();

  const userHasName = !!user?.name;
  const userSaveStatus = user?.isSaveUserDetails;

  // ✅ FIX: Only send initialization success when AuthContext is initialized
  useEffect(() => {
    Logger.info('NavigationMachine', 'Auth state check', {
      isInitialized,
      isAuthenticated,
      isGuest,
      hasUser: !!user
    });

    if (isInitialized) {
      Logger.info('NavigationMachine', 'Sending INITIALIZATION_SUCCESS');
      send({ type: 'INITIALIZATION_SUCCESS' });
    }
  }, [isInitialized, isAuthenticated, isGuest, user, send]);

  // ✅ SIMPLIFIED: Update state machine when auth state changes
  useEffect(() => {
    Logger.info('NavigationMachine', 'Auth state changed', { isAuthenticated, isGuest });
    send({
      type: 'AUTH_CHANGED',
      isAuthenticated,
      isGuest,
    });
  }, [isAuthenticated, isGuest, send]);

  // Update machine when user data changes
  useEffect(() => {
    Logger.info('NavigationMachine', 'User data changed', { userHasName, userSaveStatus });
    send({
      type: 'USER_DATA_CHANGED',
      userHasName,
      userSaveStatus,
    });
  }, [userHasName, userSaveStatus, send]);

  // Fallback timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.matches('initializing')) {
        send({ type: 'FALLBACK_TIMEOUT' });
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [state, send]);

  return {
    currentState: state.value as string,
    context: state.context,
    send,
    navigatorComponent: getNavigatorComponent(state.value as any),
    isInitialized: !state.matches('initializing'),
    shouldShowSidebar: state.matches('mainApp') || state.matches('guestApp'),
  };
};
