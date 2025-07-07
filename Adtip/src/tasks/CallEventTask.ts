// src/tasks/CallEventTask.ts
import { AppRegistry } from 'react-native';
import { getCallState } from '../stores/callStore';
import UnifiedCallService from '../services/calling/UnifiedCallService';

/**
 * Headless JS task for handling call events when app is in background
 * This is called from native WhatsAppCallService
 * Updated to use Zustand store instead of appEventEmitter
 */
const CallEventTask = async (taskData: any) => {
  console.log('[CallEventTask] Received call event:', taskData);
  
  const { event, callId, callState } = taskData;
  
  // Get the current call state from Zustand store
  const currentCallStore = getCallState();
  
  // Handle specific events by updating Zustand store
  switch (event) {
    case 'onCallStateChanged':
      console.log(`[CallEventTask] Call ${callId} state changed to: ${callState}`);
      // Update call status in Zustand store
      currentCallStore.setCallStatus(callState);
      break;
    case 'onCallAnswered':
      console.log(`[CallEventTask] Call ${callId} was answered`);
      // Update call status to connected
      currentCallStore.setCallStatus('connected');
      break;
    case 'onCallDeclined':
      console.log(`[CallEventTask] Call ${callId} was declined`);
      // End the call
      currentCallStore.endCall('declined');
      break;
    case 'onCallEnded':
      console.log(`[CallEventTask] Call ${callId} was ended`);
      // End the call
      currentCallStore.endCall('ended');
      break;
    case 'onMuteToggled':
      console.log(`[CallEventTask] Call ${callId} mute toggled`);
      // Toggle mic in store
      currentCallStore.toggleMic();
      break;
    case 'onSpeakerToggled':
      console.log(`[CallEventTask] Call ${callId} speaker toggled`);
      // Toggle speaker in store
      currentCallStore.toggleSpeaker();
      break;
    default:
      console.log(`[CallEventTask] Unknown event: ${event}`);
  }
};

// Register the headless task
AppRegistry.registerHeadlessTask('CallEventTask', () => CallEventTask);

export default CallEventTask;
