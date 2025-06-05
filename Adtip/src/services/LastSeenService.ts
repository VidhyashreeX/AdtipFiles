import ApiService from './ApiService';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Service for managing user online status and last seen timestamps
 */
class LastSeenService {
  private pingIntervalId: NodeJS.Timeout | null = null;
  private pingInterval = 60000; // 1 minute

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
  }
  
  /**
   * Stop tracking user presence
   */
  public stopTracking(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }
  
  /**
   * Send a ping to update the user's online status
   */
  private ping(): void {
    try {
      ApiService.ping().catch(error => {
        console.warn('Error sending ping:', error);
      });
    } catch (error) {
      console.warn('Exception during ping:', error);
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