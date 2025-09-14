import axios from 'axios';

// Configuration
const localhostUrl = import.meta.env.VITE_API_URL || 'http://localhost:7082';
const productionUrl = import.meta.env.VITE_API_URL || 'http://localhost:7082';

interface ChannelEarnings {
  totalEarnings: number;
  withdrawableAmount: number;
  subscribersCount: number;
  contentCounts: {
    posts: number;
    videos: number;
    shorts: number;
  };
  contentItems: any[];
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  subscriptionTier: 'basic' | 'premium' | 'vip';
}

interface ContentItem {
  id: string;
  title: string;
  type: 'post' | 'video' | 'short';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  earnings: number;
  isPaid: boolean;
  createdAt: string;
}

class AnalyticsService {
  private getAuthToken(): string | null {
    return localStorage.getItem('UserLoggedIn');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    
    try {
      const response = await fetch(`${localhostUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics service error:', error);
      throw error;
    }
  }

  async getChannelEarnings(channelId: string): Promise<ChannelEarnings | null> {
      try {
        // First get the channel details to get the user ID
        const channelDetails = await this.getChannelDetails(channelId);
        if (!channelDetails) {
          throw new Error('Channel not found');
        }

        // Get user ID from channel details or use a fallback method
        let userId = await this.getUserIdFromChannel(channelId);
        
        // Fallback: try to get user ID from localStorage
        if (!userId) {
          const storedUserId = localStorage.getItem('UserId');
          if (storedUserId) {
            console.log(`🔄 Using fallback user ID from localStorage: ${storedUserId}`);
            userId = storedUserId;
          }
        }
        
        if (!userId) {
          throw new Error('User ID not found for channel and no fallback available');
        }

        // Fetch content from multiple endpoints
        const [earningsResponse, videosResponse, shortsResponse, postsResponse] = await Promise.allSettled([
          this.makeRequest(`/api/channel/${channelId}/earnings`),
          this.makeRequest(`/api/getshots/${userId}`), // Get user's shorts
          this.makeRequest(`/api/getrecentlyuploadedvideo/${userId}`), // Get user's videos
          this.makeRequest(`/api/users/${userId}/posts?page=1&limit=50&media_type=all&loggined_user_id=${userId}`) // Get user's posts
        ]);

        // Process earnings data
        let earningsData: any = {};
        if (earningsResponse.status === 'fulfilled' && earningsResponse.value?.status) {
          earningsData = earningsResponse.value.data;
        }

        // Process content from different endpoints
        const allContentItems: any[] = [];

        // Process shorts (isShot = 1)
        if (shortsResponse.status === 'fulfilled' && shortsResponse.value?.data) {
          const shorts = Array.isArray(shortsResponse.value.data) ? shortsResponse.value.data : [];
          const transformedShorts = shorts.map((item: any) => ({
            ...item,
            type: 'short',
            title: item.name || item.title || 'Untitled Short',
            thumbnail: item.video_Thumbnail || item.thumbnail,
            isPaid: item.is_paid_promotional === 1 || item.isPaid === 1,
            earnings: item.earnings || 0,
            views: item.total_views || item.views || 0,
            likes: item.total_likes || item.likes || 0,
            comments: item.total_comments || item.comments || 0,
            shares: item.total_shares || item.shares || 0
          }));
          allContentItems.push(...transformedShorts);
        }

        // Process videos (isShot = 0)
        if (videosResponse.status === 'fulfilled' && videosResponse.value?.data) {
          const videos = Array.isArray(videosResponse.value.data) ? videosResponse.value.data : [];
          const transformedVideos = videos.map((item: any) => ({
            ...item,
            type: 'video',
            title: item.name || item.title || 'Untitled Video',
            thumbnail: item.video_Thumbnail || item.thumbnail,
            isPaid: item.is_paid_promotional === 1 || item.isPaid === 1,
            earnings: item.earnings || 0,
            views: item.total_views || item.views || 0,
            likes: item.total_likes || item.likes || 0,
            comments: item.total_comments || item.comments || 0,
            shares: item.total_shares || item.shares || 0
          }));
          allContentItems.push(...transformedVideos);
        }

        // Process posts (isShot = 2)
        if (postsResponse.status === 'fulfilled' && postsResponse.value?.data) {
          const posts = Array.isArray(postsResponse.value.data) ? postsResponse.value.data : [];
          const transformedPosts = posts.map((item: any) => ({
            ...item,
            type: 'post',
            title: item.title || 'Untitled Post',
            thumbnail: item.media_url || item.thumbnail,
            isPaid: item.is_promoted === 1 || item.isPaid === 1,
            earnings: item.earnings || 0,
            views: item.views || 0,
            likes: item.likeCount || item.likes || 0,
            comments: item.commentCount || item.comments || 0,
            shares: item.shares || 0
          }));
          allContentItems.push(...transformedPosts);
        }

        console.log(`📊 Fetched ${allContentItems.length} total content items:`, allContentItems);

        // Count content by type
        const contentCounts = {
          posts: allContentItems.filter(item => item.type === 'post').length,
          videos: allContentItems.filter(item => item.type === 'video').length,
          shorts: allContentItems.filter(item => item.type === 'short').length,
        };

        // Transform the response to match our interface
        const result: ChannelEarnings = {
          totalEarnings: earningsData.totalEarnings || 0,
          withdrawableAmount: earningsData.withdrawableAmount || 0,
          subscribersCount: earningsData.subscribersCount || 0,
          contentCounts,
          contentItems: allContentItems
        };

        return result;
      } catch (error) {
        console.error('❌ [Analytics] Error fetching earnings:', error);
        throw error; // Re-throw to let the component handle the error
      }
    }

    // Helper method to get user ID from channel
    private async getUserIdFromChannel(channelId: string): Promise<string | null> {
      try {
        console.log(`🔍 Fetching user ID for channel: ${channelId}`);
        const response = await this.makeRequest(`/api/getchannelbyuserid/${channelId}`);
        console.log(`📊 Channel response:`, response);
        
        if (response?.data && response.data.length > 0) {
          const channelData = response.data[0];
          console.log(`📊 Channel data:`, channelData);
          
          // Try multiple possible field names for user ID
          const userId = channelData.createdBy || 
                        channelData.userId || 
                        channelData.user_id || 
                        channelData.created_by ||
                        channelData.ownerId ||
                        channelData.owner_id;
          
          if (userId) {
            console.log(`✅ Found user ID: ${userId}`);
            return userId.toString();
          }
        }
        
        console.log(`❌ No user ID found in channel data`);
        return null;
      } catch (error) {
        console.error('❌ Error getting user ID from channel:', error);
        return null;
      }
    }

  // Helper method to map isShot value to content type
  private mapContentType(isShot: number, categoryId?: number): 'post' | 'video' | 'short' {
    if (isShot === 1) return 'short';
    if (isShot === 2) return 'post';
    return 'video'; // Default to video for isShot === 0
  }

  async getChannelSubscribers(channelId: string, limit: number = 50, offset: number = 0): Promise<Subscriber[]> {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}/subscribers?limit=${limit}&offset=${offset}`);
      
      if (response && response.status && response.data) {
        // New backend shape: { status, message, data: { channel_id, total_subscribers, subscribers: [...], pagination: {...} } }
        const container = response.data;
        const list = Array.isArray(container?.subscribers)
          ? container.subscribers
          : Array.isArray(container?.data?.subscribers)
            ? container.data.subscribers
            : null;

        if (!list) {
          throw new Error('Subscribers response not in expected array format');
        }

        const sanitizeAvatar = (url: any): string | undefined => {
          if (!url) return undefined;
          const s = String(url).trim().toLowerCase();
          if (s === 'null' || s === 'undefined' || s === '') return undefined;
          return String(url);
        };

        const subscribers: Subscriber[] = list.map((sub: any) => ({
          id: String(sub.user_id ?? sub.id ?? ''),
          name: sub.user_name ?? sub.name ?? '',
          email: sub.user_email ?? sub.email ?? '',
          avatar: sanitizeAvatar(sub.user_profile_image ?? sub.avatar),
          joinedAt: sub.followed_date ?? sub.joinedAt ?? '',
          subscriptionTier: 'basic'
        }));
        
        return subscribers;
      }
      
      throw new Error('Invalid response from subscribers API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching subscribers:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getChannelContent(channelId: string, type?: 'post' | 'video' | 'short'): Promise<ContentItem[]> {
    try {
      let endpoint = `/api/channel/${channelId}/content`;
      if (type) {
        endpoint += `?type=${type}`;
      }
      
      const response = await this.makeRequest(endpoint);
      
      if (response && response.status && response.data) {
        const contentItems: ContentItem[] = response.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          views: item.views || 0,
          likes: item.likes || 0,
          comments: item.comments || 0,
          shares: item.shares || 0,
          earnings: item.earnings || 0,
          isPaid: item.isPaid || false,
          createdAt: item.createdAt
        }));
        
        return contentItems;
      }
      
      throw new Error('Invalid response from content API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching content:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getChannelDetails(channelId: string): Promise<{ id: string; name: string } | null> {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}`);
      
      if (response && response.status && response.data) {
        return {
          id: response.data.id,
          name: response.data.name
        };
      }
      
      throw new Error('Invalid response from channel details API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching channel details:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getChannelAnalytics(channelId: string, period: '7d' | '30d' | '90d' = '30d') {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}/analytics?period=${period}`);
      
      if (response && response.status) {
        return response.data;
      }
      
      throw new Error('Invalid response from analytics API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching analytics:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getContentPerformance(contentId: string) {
    try {
      const response = await this.makeRequest(`/api/content/${contentId}/performance`);
      
      if (response && response.status) {
        return response.data;
      }
      
      throw new Error('Invalid response from content performance API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching content performance:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getEarningsHistory(channelId: string, period: '7d' | '30d' | '90d' = '30d') {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}/earnings/history?period=${period}`);
      
      if (response && response.status) {
        return response.data;
      }
      
      throw new Error('Invalid response from earnings history API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching earnings history:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getSubscriberAnalytics(channelId: string) {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}/subscribers/analytics`);
      
      if (response && response.status) {
        return response.data;
      }
      
      throw new Error('Invalid response from subscriber analytics API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching subscriber analytics:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getTopContent(channelId: string, limit: number = 10) {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}/content/top?limit=${limit}`);
      
      if (response && response.status) {
        return response.data;
      }
      
      throw new Error('Invalid response from top content API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching top content:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async getRevenueBreakdown(channelId: string, period: '7d' | '30d' | '90d' = '30d') {
    try {
      const response = await this.makeRequest(`/api/channel/${channelId}/revenue/breakdown?period=${period}`);
      
      if (response && response.status) {
        return response.data;
      }
      
      throw new Error('Invalid response from revenue breakdown API');
    } catch (error) {
      console.error('❌ [Analytics] Error fetching revenue breakdown:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
