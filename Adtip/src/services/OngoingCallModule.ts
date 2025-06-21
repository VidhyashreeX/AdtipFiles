import { NativeModules } from 'react-native';

const { OngoingCall } = NativeModules;

interface OngoingCallInterface {
  startOngoingCallNotification(title: string, text: string): void;
  stopOngoingCallNotification(): void;
}

export default OngoingCall as OngoingCallInterface; 