// src/tasks/CallEventTask.ts
import { AppRegistry } from 'react-native';
import { appEventEmitter } from '../events/AppEventEmitter';

/**
 * Headless JS task for handling call events when app is in background
 * This is called from native WhatsAppCallService
 */
const CallEventTask = async (taskData: any) => {
  console.log('[CallEventTask] Received call event:', taskData);
  
  const { event, callId, callState } = taskData;
  
  // Emit to app event emitter for any listening components
  appEventEmitter.emit('callEvent', {
    event,
    callId,
    callState,
    timestamp: Date.now(),
  });
  
  // Handle specific events
  switch (event) {
    case 'onCallStateChanged':
      console.log(`[CallEventTask] Call ${callId} state changed to: ${callState}`);
      break;
    case 'onCallAnswered':
      console.log(`[CallEventTask] Call ${callId} was answered`);
      // Could trigger navigation to meeting screen if needed
      break;
    case 'onCallDeclined':
      console.log(`[CallEventTask] Call ${callId} was declined`);
      break;
    case 'onCallEnded':
      console.log(`[CallEventTask] Call ${callId} was ended`);
      break;
    case 'onMuteToggled':
      console.log(`[CallEventTask] Call ${callId} mute toggled`);
      break;
    case 'onSpeakerToggled':
      console.log(`[CallEventTask] Call ${callId} speaker toggled`);
      break;
    default:
      console.log(`[CallEventTask] Unknown event: ${event}`);
  }
};

// Register the headless task
AppRegistry.registerHeadlessTask('CallEventTask', () => CallEventTask);

export default CallEventTask;
