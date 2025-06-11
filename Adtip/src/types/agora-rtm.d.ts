declare module 'agora-react-native-rtm' {
  export enum ConnectionState {
    DISCONNECTED = 1,
    CONNECTING = 2,
    CONNECTED = 3,
    RECONNECTING = 4,
    ABORTED = 5,
  }

  export enum ConnectionChangeReason {
    LOGIN = 1,
    LOGIN_SUCCESS = 2,
    LOGIN_FAILURE = 3,
    LOGIN_TIMEOUT = 4,
    INTERRUPTED = 5,
    LOGOUT = 6,
    BANNED_BY_SERVER = 7,
    REMOTE_LOGIN = 8,
    TOKEN_EXPIRED = 9,
  }

  export interface LoginInfo {
    token?: string;
    uid: string;
  }

  export interface RtmMessage {
    text: string;
    messageType?: number;
  }

  export interface RtmLocalInvitation {
    getCalleeId(): string;
    getContent(): string;
    getChannelId(): string;
    getResponse(): string;
    getState(): number;
  }

  export interface RtmRemoteInvitation {
    getCallerId(): string;
    // getContent(): string; // Remove this method
    content: string;        // Add this property
    setResponse(response: string): Promise<void>;
    getChannelId(): string;
    getResponse(): string;
    getState(): number;
  }

  // Add this new interface
  export interface RtmLocalInvitationProps {
    uid: string; 
    channelId?: string; 
    content?: string; 
  }

  export class RtmChannel {
    join(): Promise<void>;
    leave(): Promise<void>;
    sendMessage(message: string | RtmMessage): Promise<void>;
    getMembers(): Promise<Array<{ userId: string; channelId: string }>>;
  }

  export class RtmEngine {
    // Constructor is used implicitly with 'new RtmEngine()'
    
    // Instance method to initialize the client with App ID
    createClient(appId: string): Promise<void>; 

    destroy?(): Promise<void>;
    login(loginInfo: LoginInfo): Promise<void>;
    logout(): Promise<void>;
    renewToken(token: string): Promise<void>;

    // createLocalInvitation is still useful for getting an object if needed elsewhere,
    // but not for setContent. Update its signature if it accepts content/channelId.
    createLocalInvitation(calleeId: string, content?: string, channelId?: string): Promise<RtmLocalInvitation>;

    // For sending, prioritize the props version as per the fix
    sendLocalInvitation(props: RtmLocalInvitationProps): Promise<void>;
    // If the old version taking an RtmLocalInvitation object is still needed by the SDK's V2 pattern:
    // sendLocalInvitation(localInvitation: RtmLocalInvitation): Promise<void>; 

    // For cancelling, prioritize the props version
    cancelLocalInvitation(props: RtmLocalInvitationProps): Promise<void>;
    // If the old version taking an RtmLocalInvitation object is still needed:
    // cancelLocalInvitation(localInvitation: RtmLocalInvitation): Promise<void>;

    acceptRemoteInvitation(remoteInvitation: RtmRemoteInvitation): Promise<void>;
    refuseRemoteInvitation(remoteInvitation: RtmRemoteInvitation): Promise<void>;

    sendMessageToPeer(peerId: string, message: string | RtmMessage): Promise<void>;
    createChannel(channelId: string): Promise<RtmChannel>;

    on(event: string, listener: (...args: any[]) => void): void;
    removeAllListeners(event?: string): void;

    getChannelAttributes(channelId: string): Promise<Array<{ key: string; value: string }>>;
    getChannelAttributesByKeys(channelId: string, keys: string[]): Promise<Array<{ key: string; value: string }>>;
    getChannelMemberCount(channelIds: string[]): Promise<Array<{ channelId: string; count: number }>>;
  }

  export default RtmEngine;
}