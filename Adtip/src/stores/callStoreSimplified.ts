import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

// ===== Types =====
export type CallDirection = 'outgoing' | 'incoming'
export type CallType = 'voice' | 'video'
export type CallStatus =
  | 'idle'        // no call
  | 'ringing'     // incoming call ringing
  | 'outgoing'    // we are dialling, waiting for peer to accept
  | 'connecting'  // both parties accepted, joining meeting
  | 'in_call'     // media connected
  | 'ended'       // call ended

export interface CallSession {
  sessionId: string // internal session id (unique)
  meetingId: string
  token: string
  peerId: string // remote user id
  peerName: string
  direction: CallDirection
  type: CallType
  startedAt?: number
  endedAt?: number
  callId?: number // backend call record id for payment processing
}

export interface MediaState {
  mic: boolean
  cam: boolean
  speaker: boolean
}

interface CallStore {
  // ===== STATE =====
  status: CallStatus
  session: CallSession | null
  media: MediaState
  // ===== ACTIONS =====
  actions: {
    reset: () => void
    setStatus: (s: CallStatus) => void
    setSession: (session: CallSession | null) => void
    updateMedia: (updates: Partial<MediaState>) => void
  }
}

const initialMedia: MediaState = { mic: true, cam: false, speaker: true }

export const useCallStore = create<CallStore>()(
  devtools(
    subscribeWithSelector<CallStore>((set) => ({
      status: 'idle',
      session: null,
      media: initialMedia,
      actions: {
        reset: () => {
          console.log('[CallStore] Performing comprehensive reset');
          set({
            status: 'idle',
            session: null,
            media: { ...initialMedia } // Create new object to break references
          });
          console.log('[CallStore] Reset complete');
        },
        setStatus: (s: CallStatus) => {
          console.log('[CallStore] Status change:', s);
          set({ status: s });
        },
        setSession: (session: CallSession | null) => {
          // Enhanced session validation and logging
          if (session) {
            console.log('[CallStore] Setting session:', {
              sessionId: session.sessionId,
              direction: session.direction,
              type: session.type,
              peerId: session.peerId,
              hasToken: !!session.token,
              hasMeetingId: !!session.meetingId
            });

            // Validate session data integrity
            if (!session.sessionId) {
              console.warn('[CallStore] Warning: Setting session without sessionId');
            }
            if (!session.peerId) {
              console.warn('[CallStore] Warning: Setting session without peerId');
            }
            if (session.direction === 'outgoing' && (!session.token || session.token === 'temp-token')) {
              console.log('[CallStore] Note: Setting outgoing session with temporary token (will be updated)');
            }
          } else {
            console.log('[CallStore] Clearing session');
          }

          set({ session });
        },
        updateMedia: (updates: Partial<MediaState>) => {
          console.log('[CallStore] Updating media state:', updates);
          set((state: CallStore) => ({ media: { ...state.media, ...updates } }));
        },
      },
    }))
  )
)

// Convenience hooks
export const useCallStatus = () => useCallStore((s: CallStore) => s.status)
export const useCallSession = () => useCallStore((s: CallStore) => s.session)
export const useMediaState = () => useCallStore((s: CallStore) => s.media) 