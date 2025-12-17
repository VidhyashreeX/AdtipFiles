// Enhanced Home Component
// Demonstrates the improved engagement system with optimistic updates

import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePosts } from '../hooks/api/posts';
import { useBatchInitializeEngagement } from '../hooks/useEnhancedEngagement';
import EnhancedPostCard from '../components/engagement/EnhancedPostCard';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Post {
  id: number;
  title?: string;
  content: string;
  media_url?: string;
  user_id: number;
  user_name: string;
  user_profile_image?: string;
  is_liked?: boolean;
  likeCount?: number;
  like_count?: number;
  commentCount?: number;
  comment_count?: number;
  created_at: string;
  is_following?: boolean;
  follower_count?: number;
}

const EnhancedHome: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { initializePosts } = useBatchInitializeEngagement();

  // Fetch posts with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = usePosts({
    category: selectedCategory,
    user_id: user?.id,
    limit: 10,
  });

  // Initialize engagement states when posts are loaded
  useEffect(() => {
    if (data?.pages) {
      const allPosts = data.pages.flatMap(page => page.data || []);
      initializePosts(allPosts);
    }
  }, [data, initializePosts]);

  // Categories for filtering
  const categories = [
    { id: '', name: 'All', icon: '🏠' },
    { id: '1', name: 'Tech', icon: '💻' },
    { id: '2', name: 'Beauty', icon: '💄' },
    { id: '3', name: 'Gaming', icon: '🎮' },
    { id: '4', name: 'Food', icon: '🍕' },
    { id: '5', name: 'Travel', icon: '✈️' },
    { id: '6', name: 'Finance', icon: '💰' },
    { id: '7', name: 'Fashion', icon: '👗' },
    { id: '8', name: 'Music', icon: '🎵' },
  ];

  const handleCommentClick = (post: Post) => {
    console.log('Comment clicked for post:', post.id);
    // Implement comment modal or navigation
  };

  const handlePostClick = (post: Post) => {
    console.log('Post clicked:', post.id);
    // Navigate to post detail page
  };

  const allPosts = data?.pages.flatMap(page => page.data || []) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-adtip-teal" />
          <p className="text-lg font-medium">Loading enhanced feed...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing optimistic updates</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load posts: {error?.message || 'Unknown error'}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2 w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Enhanced Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-adtip-teal/10 rounded-lg">
                <Zap className="h-6 w-6 text-adtip-teal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Enhanced Feed</h1>
                <p className="text-sm text-gray-600">
                  Optimistic updates • Real-time engagement • Error recovery
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap',
                  selectedCategory === category.id && 'bg-adtip-teal hover:bg-adtip-teal/90'
                )}
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhancement Notice */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Alert className="border-adtip-teal/20 bg-adtip-teal/5 mb-6">
          <Zap className="h-4 w-4 text-adtip-teal" />
          <AlertDescription className="text-adtip-teal">
            <strong>✨ Enhanced Engagement:</strong> This feed features optimistic UI updates, 
            real-time feedback, error recovery, and improved loading states for all engagement actions.
          </AlertDescription>
        </Alert>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {allPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold mb-4">No posts yet</h2>
            <p className="text-gray-600 mb-8">
              Be the first to share something amazing!
            </p>
            <Button className="bg-adtip-teal hover:bg-adtip-teal/90">
              Create Post
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {allPosts.map((post) => (
              <EnhancedPostCard
                key={post.id}
                post={post}
                onCommentClick={handleCommentClick}
                onPostClick={handlePostClick}
                showFollowButton={post.user_id !== user?.id}
                className="hover:shadow-xl transition-shadow duration-300"
              />
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="text-center py-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  size="lg"
                  variant="outline"
                  className="min-w-32"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}

            {/* End of Feed */}
            {!hasNextPage && allPosts.length > 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">
                  🎉 You've reached the end of the feed!
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhancement Features Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            🚀 Enhanced Engagement Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-medium mb-1">Optimistic Updates</div>
              <div className="text-green-700">Instant visual feedback</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-medium mb-1">Error Recovery</div>
              <div className="text-blue-700">Automatic state restoration</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-purple-600 font-medium mb-1">Loading States</div>
              <div className="text-purple-700">Clear action feedback</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHome;