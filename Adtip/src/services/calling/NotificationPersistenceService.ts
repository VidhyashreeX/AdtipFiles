import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import notifee, { AndroidImportance } from '@notifee/react-native'

interface PendingCall {
  sessionId: string
  callerName: string
  callType: string
  meetingId?: string
  token?: string
  timestamp: number
  retryCount: number
  maxRetries: number
}

class NotificationPersistenceService {
  private static _instance: NotificationPersistenceService
  private readonly STORAGE_KEY = 'adtip_pending_calls'
  private readonly MAX_RETRIES = 3
  private readonly RETRY_INTERVAL = 5000 // 5 seconds
  private readonly CALL_TIMEOUT = 30000 // 30 seconds
  private retryTimers: Map<string, NodeJS.Timeout> = new Map()

  static getInstance() {
    if (!NotificationPersistenceService._instance) {
      NotificationPersistenceService._instance = new NotificationPersistenceService()
    }
    return NotificationPersistenceService._instance
  }

  private constructor() {
    this.initializeService()
  }

  private async initializeService() {
    console.log('[NotificationPersistence] Initializing service')
    
    // Check for any pending calls on app start
    await this.processPendingCalls()
    
    // Clean up expired calls
    await this.cleanupExpiredCalls()
  }

  /**
   * Add a call to the persistence queue
   */
  async addPendingCall(callData: Omit<PendingCall, 'timestamp' | 'retryCount' | 'maxRetries'>) {
    const pendingCall: PendingCall = {
      ...callData,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    }

    console.log('[NotificationPersistence] Adding pending call:', pendingCall.sessionId)

    try {
      const existingCalls = await this.getPendingCalls()
      
      // Remove any existing call with the same sessionId
      const filteredCalls = existingCalls.filter(call => call.sessionId !== pendingCall.sessionId)
      
      // Add the new call
      filteredCalls.push(pendingCall)
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCalls))
      
      // Start retry mechanism
      this.scheduleRetry(pendingCall)
      
      // Set timeout to auto-remove call
      this.scheduleTimeout(pendingCall.sessionId)
      
    } catch (error) {
      console.error('[NotificationPersistence] Failed to add pending call:', error)
    }
  }

  /**
   * Remove a call from the persistence queue
   */
  async removePendingCall(sessionId: string) {
    console.log('[NotificationPersistence] Removing pending call:', sessionId)

    try {
      const existingCalls = await this.getPendingCalls()
      const filteredCalls = existingCalls.filter(call => call.sessionId !== sessionId)
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCalls))
      
      // Clear any retry timer
      const timer = this.retryTimers.get(sessionId)
      if (timer) {
        clearTimeout(timer)
        this.retryTimers.delete(sessionId)
      }
      
    } catch (error) {
      console.error('[NotificationPersistence] Failed to remove pending call:', error)
    }
  }

  /**
   * Get all pending calls
   */
  private async getPendingCalls(): Promise<PendingCall[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('[NotificationPersistence] Failed to get pending calls:', error)
      return []
    }
  }

  /**
   * Process all pending calls (called on app start)
   */
  private async processPendingCalls() {
    console.log('[NotificationPersistence] Processing pending calls')

    try {
      const pendingCalls = await this.getPendingCalls()
      
      for (const call of pendingCalls) {
        // Check if call is still valid (not expired)
        if (this.isCallExpired(call)) {
          await this.removePendingCall(call.sessionId)
          continue
        }
        
        // Retry the notification
        await this.retryNotification(call)
      }
    } catch (error) {
      console.error('[NotificationPersistence] Failed to process pending calls:', error)
    }
  }

  /**
   * Clean up expired calls
   */
  private async cleanupExpiredCalls() {
    console.log('[NotificationPersistence] Cleaning up expired calls')

    try {
      const pendingCalls = await this.getPendingCalls()
      const validCalls = pendingCalls.filter(call => !this.isCallExpired(call))
      
      if (validCalls.length !== pendingCalls.length) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(validCalls))
        console.log('[NotificationPersistence] Removed expired calls')
      }
    } catch (error) {
      console.error('[NotificationPersistence] Failed to cleanup expired calls:', error)
    }
  }

  /**
   * Check if a call has expired
   */
  private isCallExpired(call: PendingCall): boolean {
    return Date.now() - call.timestamp > this.CALL_TIMEOUT
  }

  /**
   * Schedule a retry for a pending call
   */
  private scheduleRetry(call: PendingCall) {
    if (call.retryCount >= call.maxRetries) {
      console.log('[NotificationPersistence] Max retries reached for call:', call.sessionId)
      this.removePendingCall(call.sessionId)
      return
    }

    const timer = setTimeout(async () => {
      await this.retryNotification(call)
    }, this.RETRY_INTERVAL * (call.retryCount + 1)) // Exponential backoff

    this.retryTimers.set(call.sessionId, timer)
  }

  /**
   * Schedule timeout for auto-removal
   */
  private scheduleTimeout(sessionId: string) {
    setTimeout(() => {
      console.log('[NotificationPersistence] Call timeout reached:', sessionId)
      this.removePendingCall(sessionId)
    }, this.CALL_TIMEOUT)
  }

  /**
   * Retry a notification
   */
  private async retryNotification(call: PendingCall) {
    console.log('[NotificationPersistence] Retrying notification:', call.sessionId, 'attempt:', call.retryCount + 1)

    try {
      // Import NotificationService dynamically to avoid circular dependencies
      const { default: NotificationService } = await import('./NotificationService')
      const notificationService = NotificationService.getInstance()
      
      // Try to show the notification again
      await notificationService.showIncomingCall(
        call.sessionId,
        call.callerName,
        call.callType as any,
        call.meetingId,
        call.token
      )
      
      // Update retry count
      call.retryCount++
      
      // Update storage
      const pendingCalls = await this.getPendingCalls()
      const updatedCalls = pendingCalls.map(c => 
        c.sessionId === call.sessionId ? call : c
      )
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedCalls))
      
      // Schedule next retry if needed
      if (call.retryCount < call.maxRetries) {
        this.scheduleRetry(call)
      } else {
        await this.removePendingCall(call.sessionId)
      }
      
    } catch (error) {
      console.error('[NotificationPersistence] Failed to retry notification:', error)
      
      // Still increment retry count and schedule next attempt
      call.retryCount++
      if (call.retryCount < call.maxRetries) {
        this.scheduleRetry(call)
      } else {
        await this.removePendingCall(call.sessionId)
      }
    }
  }

  /**
   * Create a fallback notification using basic system notification
   */
  async createFallbackNotification(sessionId: string, callerName: string, callType: string) {
    console.log('[NotificationPersistence] Creating fallback notification')

    try {
      await notifee.displayNotification({
        id: `fallback_${sessionId}`,
        title: 'Missed Call',
        body: `${callerName} tried to call you`,
        android: {
          channelId: 'missed-calls',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          smallIcon: 'ic_notification',
          actions: [
            { title: 'Call Back', pressAction: { id: 'callback' } },
            { title: 'Dismiss', pressAction: { id: 'dismiss' } },
          ],
        },
        data: { sessionId, callerName, callType, isFallback: 'true' },
      })
    } catch (error) {
      console.error('[NotificationPersistence] Failed to create fallback notification:', error)
    }
  }

  /**
   * Get statistics about pending calls
   */
  async getStatistics() {
    const pendingCalls = await this.getPendingCalls()
    return {
      totalPending: pendingCalls.length,
      expiredCalls: pendingCalls.filter(call => this.isCallExpired(call)).length,
      activeRetries: this.retryTimers.size
    }
  }

  /**
   * Clear all pending calls (for testing/debugging)
   */
  async clearAllPendingCalls() {
    console.log('[NotificationPersistence] Clearing all pending calls')
    
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY)
      
      // Clear all timers
      this.retryTimers.forEach(timer => clearTimeout(timer))
      this.retryTimers.clear()
      
    } catch (error) {
      console.error('[NotificationPersistence] Failed to clear pending calls:', error)
    }
  }
}

export default NotificationPersistenceService
