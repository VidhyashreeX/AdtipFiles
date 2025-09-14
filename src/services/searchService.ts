import axios from 'axios';

// Configuration
const localhostUrl = import.meta.env.VITE_API_URL || 'http://localhost:7082';

interface SearchResult {
  id: string;
  title: string;
  type: 'video' | 'short' | 'post' | 'user' | 'channel';
  description?: string;
  thumbnail?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string;
  channelName?: string;
  channelProfile?: string;
  userName?: string;
  userProfile?: string;
  isPaid?: boolean;
  earnings?: number;
}

interface SearchResponse {
  status: boolean;
  message: string;
  data: SearchResult[];
  pagination?: {
    current_page: number;
    total_page: number;
    total_count: number;
  };
}

class SearchService {
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
      console.error('Search service error:', error);
      throw error;
    }
  }

  // Search videos using the backend search endpoint
  async searchVideos(searchTerm: string, page: number = 1): Promise<SearchResult[]> {
    try {
      const response = await this.makeRequest('/api/searchfuntube', {
        method: 'POST',
        body: JSON.stringify({
          searchname: searchTerm,
          page: page
        })
      });

      if (response && response.status) {
        return this.transformSearchResults(response.data || []);
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching videos:', error);
      throw error;
    }
  }

  // Search public content (videos, shorts, posts)
  async searchPublicContent(searchTerm: string, type: 'all' | 'videos' | 'shorts' | 'posts' = 'all', limit: number = 20, offset: number = 0): Promise<SearchResult[]> {
    try {
      const response = await this.makeRequest(`/api/public/home/videos?type=${type}&limit=${limit}&offset=${offset}&sort=latest&search=${encodeURIComponent(searchTerm)}`);
      
      if (response && response.status) {
        return this.transformSearchResults(response.data || []);
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching public content:', error);
      throw error;
    }
  }

  // Search user's own content
  async searchUserContent(userId: string, searchTerm: string, type: 'all' | 'videos' | 'shorts' | 'posts' = 'all'): Promise<SearchResult[]> {
    try {
      const results: SearchResult[] = [];
      
      // Search in different content types
      const searchPromises = [];
      
      if (type === 'all' || type === 'videos') {
        searchPromises.push(this.searchUserVideos(userId, searchTerm));
      }
      
      if (type === 'all' || type === 'shorts') {
        searchPromises.push(this.searchUserShorts(userId, searchTerm));
      }
      
      if (type === 'all' || type === 'posts') {
        searchPromises.push(this.searchUserPosts(userId, searchTerm));
      }

      const searchResults = await Promise.allSettled(searchPromises);
      
      searchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        }
      });

      return results;
    } catch (error) {
      console.error('❌ [Search] Error searching user content:', error);
      throw error;
    }
  }

  // Search user's videos
  private async searchUserVideos(userId: string, searchTerm: string): Promise<SearchResult[]> {
    try {
      const response = await this.makeRequest(`/api/getrecentlyuploadedvideo/${userId}`);
      
      if (response && response.data) {
        const videos = Array.isArray(response.data) ? response.data : [];
        const filteredVideos = videos.filter((video: any) => 
          video.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.video_desciption?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filteredVideos.map((video: any) => ({
          id: video.id?.toString() || '',
          title: video.name || 'Untitled Video',
          type: 'video' as const,
          description: video.video_desciption,
          thumbnail: video.video_Thumbnail,
          views: video.total_views || video.views || 0,
          likes: video.total_likes || video.likes || 0,
          comments: video.total_comments || video.comments || 0,
          shares: video.total_shares || video.shares || 0,
          createdAt: video.createddate,
          channelName: video.channelName,
          channelProfile: video.channel_profile,
          isPaid: video.is_paid_promotional === 1,
          earnings: video.earnings || 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching user videos:', error);
      return [];
    }
  }

  // Search user's shorts
  private async searchUserShorts(userId: string, searchTerm: string): Promise<SearchResult[]> {
    try {
      const response = await this.makeRequest(`/api/getshots/${userId}`);
      
      if (response && response.data) {
        const shorts = Array.isArray(response.data) ? response.data : [];
        const filteredShorts = shorts.filter((short: any) => 
          short.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          short.video_desciption?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filteredShorts.map((short: any) => ({
          id: short.id?.toString() || '',
          title: short.name || 'Untitled Short',
          type: 'short' as const,
          description: short.video_desciption,
          thumbnail: short.video_Thumbnail,
          views: short.total_views || short.views || 0,
          likes: short.total_likes || short.likes || 0,
          comments: short.total_comments || short.comments || 0,
          shares: short.total_shares || short.shares || 0,
          createdAt: short.createddate,
          channelName: short.channelName,
          channelProfile: short.channel_profile,
          isPaid: short.is_paid_promotional === 1,
          earnings: short.earnings || 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching user shorts:', error);
      return [];
    }
  }

  // Search user's posts
  private async searchUserPosts(userId: string, searchTerm: string): Promise<SearchResult[]> {
    try {
      const response = await this.makeRequest(`/api/users/${userId}/posts?page=1&limit=50&media_type=all&loggined_user_id=${userId}`);
      
      if (response && response.data) {
        const posts = Array.isArray(response.data) ? response.data : [];
        const filteredPosts = posts.filter((post: any) => 
          post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filteredPosts.map((post: any) => ({
          id: post.id?.toString() || '',
          title: post.title || 'Untitled Post',
          type: 'post' as const,
          description: post.content,
          thumbnail: post.media_url,
          views: post.views || 0,
          likes: post.likeCount || post.likes || 0,
          comments: post.commentCount || post.comments || 0,
          shares: post.shares || 0,
          createdAt: post.createddate,
          userName: post.user_name,
          userProfile: post.user_profile_image,
          isPaid: post.is_promoted === 1,
          earnings: post.earnings || 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching user posts:', error);
      return [];
    }
  }

  // Search channels
  async searchChannels(searchTerm: string): Promise<SearchResult[]> {
    try {
      // This would need a dedicated channel search endpoint
      // For now, we'll return empty array
      console.log('Channel search not implemented yet');
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching channels:', error);
      return [];
    }
  }

  // Search users
  async searchUsers(searchTerm: string): Promise<SearchResult[]> {
    try {
      // This would need a dedicated user search endpoint
      // For now, we'll return empty array
      console.log('User search not implemented yet');
      return [];
    } catch (error) {
      console.error('❌ [Search] Error searching users:', error);
      return [];
    }
  }

  // Transform search results to consistent format
  private transformSearchResults(data: any[]): SearchResult[] {
    return data.map((item: any) => ({
      id: item.id?.toString() || '',
      title: item.name || item.title || 'Untitled',
      type: this.mapContentType(item.isShot, item.media_type),
      description: item.video_desciption || item.content || item.description,
      thumbnail: item.video_Thumbnail || item.media_url || item.thumbnail,
      views: item.total_views || item.views || 0,
      likes: item.total_likes || item.likeCount || item.likes || 0,
      comments: item.total_comments || item.commentCount || item.comments || 0,
      shares: item.total_shares || item.shares || 0,
      createdAt: item.createddate || item.createdAt,
      channelName: item.channelName,
      channelProfile: item.channel_profile,
      userName: item.user_name,
      userProfile: item.user_profile_image,
      isPaid: item.is_paid_promotional === 1 || item.is_promoted === 1,
      earnings: item.earnings || 0
    }));
  }

  // Helper method to map content type
  private mapContentType(isShot?: number, mediaType?: string): 'video' | 'short' | 'post' | 'user' | 'channel' {
    if (isShot === 1) return 'short';
    if (isShot === 2) return 'post';
    if (mediaType === 'image' || mediaType === 'video') return 'post';
    return 'video'; // Default to video for isShot === 0
  }

  // Global search across all content types
  async globalSearch(searchTerm: string, filters?: {
    type?: 'all' | 'videos' | 'shorts' | 'posts' | 'users' | 'channels';
    limit?: number;
    offset?: number;
  }): Promise<SearchResult[]> {
    try {
      const { type = 'all', limit = 20, offset = 0 } = filters || {};
      
      const results: SearchResult[] = [];
      
      // Search public content
      if (type === 'all' || ['videos', 'shorts', 'posts'].includes(type)) {
        const publicResults = await this.searchPublicContent(searchTerm, type as any, limit, offset);
        results.push(...publicResults);
      }
      
      // Search videos using the dedicated search endpoint
      if (type === 'all' || type === 'videos') {
        const videoResults = await this.searchVideos(searchTerm);
        results.push(...videoResults);
      }
      
      return results;
    } catch (error) {
      console.error('❌ [Search] Error in global search:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();
export default searchService;
