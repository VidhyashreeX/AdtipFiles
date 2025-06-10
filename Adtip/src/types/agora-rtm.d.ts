declare module 'agora-react-native-rtm' {
  export enum ConnectionState {
    DISCONNECTED = 1,
    CONNECTING = 2,
    CONNECTED = 3,
    RECONNECTING = 4,
    ABORTED = 5
  }

  export enum ConnectionChangeReason {
    LOGIN = 1,
    LOGIN_SUCCESS = 2,
    LOGIN_FAILURE = 3,
    LOGIN_TIMEOUT = 4,
    INTERRUPTED = 5,
    LOGOUT = 6,
    BANNED_BY_SERVER = 7,
    REMOTE_LOGIN = 8
  }

  export interface RtmStatusCode {
    [key: string]: number;
  }

  export interface LoginInfo {
    token: string;
    uid: string; // Ensure uid is required
  }

  export interface LocalInvitationProps {
    calleeId: string;
    content?: string;
    channelId?: string;
    state?: number;
    response?: string;
  }

  export interface RemoteInvitationProps {
    callerId: string;
    content?: string;
    channelId?: string;
    state?: number;
    response?: string;
  }

  export class RtmLocalInvitation {
    constructor(calleeId: string);
    setContent(content: string): Promise<void>;
    send(): Promise<void>;
    cancel(): Promise<void>;
    getCalleeId(): string;
    getContent(): string;
    getChannelId(): string;
    getState(): number;
    getResponse(): string;
  }

  export class RtmRemoteInvitation {
    accept(): Promise<void>;
    refuse(): Promise<void>;
    setResponse(response: string): Promise<void>;
    getCallerId(): string;
    getContent(): string;
    getChannelId(): string;
    getState(): number;
    getResponse(): string;
  }

  export interface RtmMessage {
    text: string;
    messageType?: string;
    rawMessage?: Uint8Array;
    serverReceivedTs?: number;
    isOfflineMessage?: boolean;
  }

  export default class RtmEngine {
    constructor();
    createInstance(appId: string): Promise<void>;
    destroy(): Promise<void>;
    login(loginInfo: LoginInfo): Promise<void>;
    logout(): Promise<void>;
    renewToken(token: string): Promise<void>;
    createLocalInvitation(calleeId: string): Promise<RtmLocalInvitation>;
    sendLocalInvitation(localInvitation: RtmLocalInvitation): Promise<void>;
    cancelLocalInvitation(localInvitation: RtmLocalInvitation): Promise<void>;
    acceptRemoteInvitation(remoteInvitation: RtmRemoteInvitation): Promise<void>;
    refuseRemoteInvitation(remoteInvitation: RtmRemoteInvitation): Promise<void>;
    sendMessageToPeer(peerId: string, message: string | RtmMessage): Promise<void>;
    createChannel(channelId: string): Promise<RtmChannel>;
    getChannelAttributesByKeys(channelId: string, keys: string[]): Promise<any>;
    getChannelAttributes(channelId: string): Promise<any>;
    removeAllListeners(): void;
    on(event: string, listener: Function): void;
  }

  export class RtmChannel {
    join(): Promise<void>;
    leave(): Promise<void>;
    sendMessage(message: string | RtmMessage): Promise<void>;
    getMembers(): Promise<any[]>;
  }
}