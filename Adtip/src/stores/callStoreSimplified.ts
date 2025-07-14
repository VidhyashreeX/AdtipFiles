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
        setStatus: (s: CallStatus) => set({ status: s }),
        setSession: (session: CallSession | null) => set({ session }),
        updateMedia: (updates: Partial<MediaState>) => set((state: CallStore) => ({ media: { ...state.media, ...updates } })),
      },
    }))
  )
)

// Convenience hooks
export const useCallStatus = () => useCallStore((s: CallStore) => s.status)
export const useCallSession = () => useCallStore((s: CallStore) => s.session)
export const useMediaState = () => useCallStore((s: CallStore) => s.media) 