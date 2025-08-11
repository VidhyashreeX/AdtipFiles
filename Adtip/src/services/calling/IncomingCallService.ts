// src/services/calling/IncomingCallService.ts
import { AppRegistry } from 'react-native';
import CallKeepService from './CallKeepService';
import CallController from './CallController';
import { Logger } from '../../utils/ProductionLogger';

const handleIncomingCall = async (data: any) => {
  Logger.info('[IncomingCallService] Headless task started for incoming call', data);
  try {
    const callData = data.call;
    if (callData) {
      // Use CallController to handle the incoming call logic
      await CallController.getInstance().handleIncomingCall(callData);
    } else {
      Logger.warn('[IncomingCallService] No call data found in headless task payload');
    }
  } catch (error) {
    Logger.error('[IncomingCallService] Error handling incoming call in headless task:', error);
  }
};

const IncomingCallService = {
  registerHeadlessTask: () => {
    AppRegistry.registerHeadlessTask('IncomingCall', () => handleIncomingCall);
    Logger.info('[IncomingCallService] Headless task registered for incoming calls.');
  },
};

export default IncomingCallService;
