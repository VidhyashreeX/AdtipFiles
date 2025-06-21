import { CallType } from "./videosdk";

export interface ActiveCall {
  callId: string;
  meetingId: string;
  token: string;
  caller: {
    id: string;
    name: string;
  };
  recipient: {
    id: string;
    name: string;
  };
  isInitiator: boolean;
  callType: CallType;
  status: "dialing" | "ringing" | "connecting" | "connected" | "ended" | "failed";
}
