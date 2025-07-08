// src/tasks/CallEventTask.ts
import './../stores/callStore';
import { AppRegistry } from 'react-native';
import { getCallState } from '../stores/callStore';
import UnifiedCallService from '../services/calling/UnifiedCallService';

/**
 * Wait for Zustand call store to be ready (retry loop)
 */
const waitForCallStore = async (retries = 20, delayMs = 100) => {
  for (let i = 0; i < retries; i++) {
    // Dynamically import to avoid circular deps in some headless contexts
    const { getCallState } = require('../stores/callStore');
    const store = getCallState();
    if (store) return store;
    await new Promise(res => setTimeout(res, delayMs));
  }
  console.error('[CallEventTask] Zustand call store not initialized after retries!');
  return undefined;
};

/**
 * Headless JS task for handling call events when app is in background
 * This is called from native WhatsAppCallService
 * Updated to use Zustand store instead of appEventEmitter
 */
const CallEventTask = async (taskData: any) => {
  console.log('[CallEventTask] Received call event:', taskData);
  
  const { event, callId, callState } = taskData;
  
  // Wait for the Zustand store to be ready
  const currentCallStore = await waitForCallStore();
  if (!currentCallStore) {
    console.error('[CallEventTask] Aborting: Zustand store not ready.');
    return;
  }
  
  // Handle specific events by updating Zustand store
  switch (event) {
    case 'onCallStateChanged':
      console.log(`[CallEventTask] Call ${callId} state changed to: ${callState}`);
      currentCallStore.setCallStatus(callState);
      break;
    case 'onCallAnswered':
      console.log(`[CallEventTask] Call ${callId} was answered`);
      currentCallStore.setCallStatus('connected');
      break;
    case 'onCallDeclined':
      console.log(`[CallEventTask] Call ${callId} was declined`);
      currentCallStore.endCall('declined');
      break;
    case 'onCallEnded':
      console.log(`[CallEventTask] Call ${callId} was ended`);
      currentCallStore.endCall('ended');
      break;
    case 'onMuteToggled':
      console.log(`[CallEventTask] Call ${callId} mute toggled`);
      currentCallStore.toggleMic();
      break;
    case 'onSpeakerToggled':
      console.log(`[CallEventTask] Call ${callId} speaker toggled`);
      currentCallStore.toggleSpeaker();
      break;
    default:
      console.log(`[CallEventTask] Unknown event: ${event}`);
  }
};

// Register the headless task
AppRegistry.registerHeadlessTask('CallEventTask', () => CallEventTask);

export default CallEventTask;
