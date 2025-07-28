// src/machines/navigationMachine.ts
import { createMachine, assign } from 'xstate';

export interface NavigationContext {
  isAuthenticated: boolean;
  isGuest: boolean;
  userHasName: boolean;
  userSaveStatus: number | null;
  initializationError: string | null;
  retryCount: number;
}

export type NavigationEvent =
  | { type: 'INITIALIZE' }
  | { type: 'AUTH_CHANGED'; isAuthenticated: boolean; isGuest: boolean }
  | { type: 'USER_DATA_CHANGED'; userHasName: boolean; userSaveStatus: number | null }
  | { type: 'INITIALIZATION_SUCCESS' }
  | { type: 'INITIALIZATION_ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'FALLBACK_TIMEOUT' };

export const navigationMachine = createMachine({
  id: 'navigation',
  initial: 'initializing',
  context: {
    isAuthenticated: false,
    isGuest: false,
    userHasName: false,
    userSaveStatus: null,
    initializationError: null,
    retryCount: 0,
  },
  types: {} as {
    context: NavigationContext;
    events: NavigationEvent;
  },
  states: {
    initializing: {
      on: {
        INITIALIZATION_SUCCESS: {
          target: 'evaluatingRoute',
        },
        INITIALIZATION_ERROR: {
          target: 'error',
          actions: assign({
            initializationError: ({ event }) => event.error,
          }),
        },
        FALLBACK_TIMEOUT: {
          target: 'fallback',
        },
      },
    },
    evaluatingRoute: {
      always: [
        {
          target: 'mainApp',
          guard: 'shouldShowMainApp',
        },
        {
          target: 'guestApp',
          guard: 'shouldShowGuestApp',
        },
        {
          target: 'auth',
        },
      ],
      on: {
        AUTH_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            isAuthenticated: ({ event }) => event.isAuthenticated,
            isGuest: ({ event }) => event.isGuest,
          }),
        },
        USER_DATA_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            userHasName: ({ event }) => event.userHasName,
            userSaveStatus: ({ event }) => event.userSaveStatus,
          }),
        },
      },
    },
    mainApp: {
      on: {
        AUTH_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            isAuthenticated: ({ event }) => event.isAuthenticated,
            isGuest: ({ event }) => event.isGuest,
          }),
        },
        USER_DATA_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            userHasName: ({ event }) => event.userHasName,
            userSaveStatus: ({ event }) => event.userSaveStatus,
          }),
        },
      },
    },
    guestApp: {
      on: {
        AUTH_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            isAuthenticated: ({ event }) => event.isAuthenticated,
            isGuest: ({ event }) => event.isGuest,
          }),
        },
      },
    },
    auth: {
      on: {
        AUTH_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            isAuthenticated: ({ event }) => event.isAuthenticated,
            isGuest: ({ event }) => event.isGuest,
          }),
        },
        USER_DATA_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            userHasName: ({ event }) => event.userHasName,
            userSaveStatus: ({ event }) => event.userSaveStatus,
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'initializing',
          actions: assign({
            retryCount: ({ context }) => context.retryCount + 1,
            initializationError: () => null,
          }),
        },
      },
    },
    fallback: {
      on: {
        AUTH_CHANGED: {
          target: 'evaluatingRoute',
          actions: assign({
            isAuthenticated: ({ event }) => event.isAuthenticated,
            isGuest: ({ event }) => event.isGuest,
          }),
        },
      },
    },
  },
}, {
  guards: {
    shouldShowMainApp: ({ context }) => {
      return context.isAuthenticated && context.userHasName && context.userSaveStatus === 1;
    },
    shouldShowGuestApp: ({ context }) => {
      return context.isGuest;
    },
  },
});

export type NavigationState = 
  | 'initializing'
  | 'evaluatingRoute'
  | 'mainApp'
  | 'guestApp'
  | 'auth'
  | 'error'
  | 'fallback';

export const getNavigatorComponent = (state: NavigationState) => {
  switch (state) {
    case 'initializing':
      return 'InitialLoading';
    case 'mainApp':
      return 'Main';
    case 'guestApp':
      return 'Guest';
    case 'auth':
    case 'fallback':
    case 'error':
      return 'Auth';
    default:
      return 'Auth';
  }
};
