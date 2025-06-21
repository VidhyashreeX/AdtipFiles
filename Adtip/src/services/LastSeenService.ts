import ApiService from './ApiService';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Service for managing user online status and last seen timestamps
 */
class LastSeenService {
  private pingIntervalId: NodeJS.Timeout | null = null;
  private pingInterval = 600000; // 10 minutes

  /**
   * Start tracking user's online presence
   */
  public startTracking(): void {
    this.stopTracking(); // Clear any existing interval first
    
    // Send initial ping
    this.ping();
    
    // Setup regular pings
    this.pingIntervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
    
    console.log(`🔄 Ping service started, will ping every ${this.pingInterval / 60000} minutes`);
  }
  
  /**
   * Stop tracking user presence
   */
  public stopTracking(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
      console.log('🔄 Ping service stopped');
    }
  }
  
  /**
   * Send a ping to update the user's online status
   * Now public so it can be called directly when needed
   */
  public ping(): void {
    try {
      console.log('🔄 Sending ping to update online status...');
      
      ApiService.ping()
        .then(response => {
          // Log the complete response
          console.log('🔄 Ping API Response:', response);
          
          // You can also log specific parts of the response if needed
          if (response && response.data) {
            console.log('🔄 Ping successful, last seen updated at:', 
              response.data.last_active || response.data.timestamp || new Date().toISOString());
          }
        })
        .catch(error => {
          console.warn('❌ Error sending ping:', error);
          
          // Log more details about the error
          if (error.response) {
            console.warn('❌ Server response:', error.response.data);
            console.warn('❌ Status code:', error.response.status);
          } else if (error.request) {
            console.warn('❌ Request made but no response received');
          } else {
            console.warn('❌ Error message:', error.message);
          }
        });
    } catch (error) {
      console.warn('❌ Exception during ping:', error);
    }
  }
  
  /**
   * Format the last seen timestamp into a human-readable string
   */
  public formatLastSeen(timestamp: string | null): string {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Within last 7 days
      return `${format(date, 'EEEE')} at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  }
  
  /**
   * Get relative time (e.g., "2 hours ago")
   */
  public getRelativeTime(timestamp: string | null): string {
    if (!timestamp) return 'Never';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }
}

export default new LastSeenService();