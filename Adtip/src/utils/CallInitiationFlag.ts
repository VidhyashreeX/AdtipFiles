/**
 * Simple utility to manage call initiation flag to prevent AppOpenAdManager interference
 * This avoids circular dependency issues between CallController and AppOpenAdManager
 */

let isCallInitiationInProgress = false;

export const setCallInitiationInProgress = (inProgress: boolean) => {
  isCallInitiationInProgress = inProgress;
  console.log('[CallInitiationFlag] Call initiation flag set to:', inProgress);
};

export const isCallInitiationActive = () => isCallInitiationInProgress;

export const getCallInitiationStatus = () => ({
  isCallInitiationInProgress
});
