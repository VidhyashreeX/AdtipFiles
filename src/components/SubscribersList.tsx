import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, Calendar, Crown, Star } from 'lucide-react';
import { userAPI } from '@/services/api';

interface Subscriber {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  subscribedAt: string;
  isPremium: boolean;
  isVerified: boolean;
  subscriptionTier?: 'basic' | 'premium' | 'vip';
}

interface SubscribersListProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
  subscriberCount: number;
}

const SubscribersList: React.FC<SubscribersListProps> = ({
  channelId,
  isOpen,
  onClose,
  subscriberCount
}) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'basic' | 'premium' | 'vip'>('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Mock data for demonstration - replace with actual API call
  const mockSubscribers: Subscriber[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      subscribedAt: '2024-01-10T10:30:00Z',
      isPremium: true,
      isVerified: true,
      subscriptionTier: 'premium'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      subscribedAt: '2024-01-12T14:20:00Z',
      isPremium: false,
      isVerified: false,
      subscriptionTier: 'basic'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      subscribedAt: '2024-01-15T09:15:00Z',
      isPremium: true,
      isVerified: true,
      subscriptionTier: 'vip'
    }
  ];

  useEffect(() => {
    if (isOpen && channelId) {
      fetchSubscribers(true);
    }
  }, [isOpen, channelId]);

  const fetchSubscribers = async (reset = false) => {
    if (reset) {
      setOffset(0);
      setSubscribers([]);
      setHasMore(true);
    }
    
    setLoading(reset);
    setLoadingMore(!reset);
    setError(null);
    
    try {
      // Try new simplified analytics server first
      try {
        const { analyticsService } = await import('@/services/analyticsService');
        const simplifiedSubscribers = await analyticsService.getChannelSubscribers(channelId, 20, offset);
        // Transform the data to match the expected Subscriber interface
        const transformedSubscribers: Subscriber[] = simplifiedSubscribers.map(sub => ({
          id: sub.id,
          name: sub.name,
          email: sub.email,
          profileImage: sub.avatar,
          subscribedAt: sub.joinedAt,
          isPremium: sub.subscriptionTier === 'premium' || sub.subscriptionTier === 'vip',
          isVerified: false,
          subscriptionTier: sub.subscriptionTier as 'basic' | 'premium' | 'vip'
        }));
        
        if (reset) {
          setSubscribers(transformedSubscribers);
        } else {
          setSubscribers(prev => [...prev, ...transformedSubscribers]);
        }
        
        setHasMore(transformedSubscribers.length === 20);
        setOffset(prev => prev + 20);
        return;
      } catch (simplifiedError) {
        console.error('❌ Analytics service failed:', simplifiedError);
        throw simplifiedError;
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError(err instanceof Error ? err.message : 'Unable to load subscriber data. Please try again later.');
      setSubscribers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTier === 'all' || subscriber.subscriptionTier === filterTier;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'vip':
        return <Badge className="bg-teal-100 text-teal-800"><Crown className="h-3 w-3 mr-1" />VIP</Badge>;
      case 'premium':
        return <Badge className="bg-gold-100 text-gold-800"><Star className="h-3 w-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="secondary">Basic</Badge>;
    }
  };

  // Strict image acceptor: only allow http/https URLs excluding known bad tokens
  const getSafeProfileImage = (profileImage?: string) => {
    if (!profileImage) return undefined;
    const url = String(profileImage).trim();
    if (!/^https?:\/\//i.test(url)) return undefined;
    const lower = url.toLowerCase();
    if (lower.includes('rn_image_picker_lib_temp') || lower.startsWith('file://')) return undefined;
    // Skip file.adtip.in URLs as they're not resolving
    if (lower.includes('file.adtip.in')) return undefined;
    return url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscribers ({subscriberCount})
          </DialogTitle>
          <DialogDescription>
            View and manage your channel subscribers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          {/* Subscribers List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading subscribers...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Unable to Load Subscribers</p>
                </div>
                <p className="text-gray-600 text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => fetchSubscribers(true)}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No subscribers found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={getSafeProfileImage(subscriber.profileImage)} 
                          alt={subscriber.name}
                          onError={(e) => {
                            // Hide the broken image and show fallback
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <AvatarFallback>
                          {subscriber.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{subscriber.name}</h3>
                          {subscriber.isVerified && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{subscriber.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Subscribed {formatDate(subscriber.subscribedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getTierBadge(subscriber.subscriptionTier || 'basic')}
                    </div>
                  </div>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => fetchSubscribers(false)}
                      disabled={loadingMore}
                      variant="outline"
                      className="w-full"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredSubscribers.length} of {subscriberCount} subscribers
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscribersList;
