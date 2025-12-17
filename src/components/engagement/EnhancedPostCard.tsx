// Enhanced Post Card Component
// Demonstrates proper usage of enhanced engagement components

import React from 'react';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import EnhancedLikeButton from './EnhancedLikeButton';
import EnhancedFollowButton from './EnhancedFollowButton';
import EnhancedShareButton from './EnhancedShareButton';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';

export interface Post {
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

export interface EnhancedPostCardProps {
  post: Post;
  onCommentClick?: (post: Post) => void;
  onPostClick?: (post: Post) => void;
  className?: string;
  showFollowButton?: boolean;
}

const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({
  post,
  onCommentClick,
  onPostClick,
  className,
  showFollowButton = true,
}) => {
  const likeCount = post.likeCount || post.like_count || 0;
  const commentCount = post.commentCount || post.comment_count || 0;

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommentClick?.(post);
  };

  const handleCardClick = () => {
    onPostClick?.(post);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={post.user_profile_image} 
                alt={post.user_name}
              />
              <AvatarFallback>
                {post.user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{post.user_name}</h4>
                {showFollowButton && (
                  <EnhancedFollowButton
                    userId={post.user_id}
                    initialIsFollowing={post.is_following}
                    initialFollowerCount={post.follower_count}
                    size="sm"
                    variant="outline"
                    showIcon={false}
                    className="h-6 px-2 text-xs"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {post.title && (
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          )}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="relative">
            {post.media_url.includes('video') || post.media_url.includes('.mp4') ? (
              <video
                src={post.media_url}
                className="w-full max-h-96 object-cover"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={post.media_url}
                alt={post.title || 'Post media'}
                className="w-full max-h-96 object-cover"
              />
            )}
          </div>
        )}

        {/* Engagement Actions */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Enhanced Like Button */}
              <EnhancedLikeButton
                postId={post.id}
                initialIsLiked={post.is_liked}
                initialLikeCount={likeCount}
                size="md"
                showCount={true}
                onLikeChange={(isLiked, newCount) => {
                  console.log(`Post ${post.id} ${isLiked ? 'liked' : 'unliked'}, new count: ${newCount}`);
                }}
              />

              {/* Comment Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentClick}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {commentCount.toLocaleString()}
                </span>
              </Button>

              {/* Enhanced Share Button */}
              <EnhancedShareButton
                postId={post.id}
                postTitle={post.title || `Post by ${post.user_name}`}
                postDescription={post.content}
                size="md"
                variant="ghost"
                showIcon={true}
                showText={false}
                className="px-3 py-2"
                onShare={(platform) => {
                  console.log(`Post ${post.id} shared on ${platform}`);
                }}
              />
            </div>
          </div>

          {/* Engagement Summary */}
          {(likeCount > 0 || commentCount > 0) && (
            <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {likeCount > 0 && (
                  <span>{likeCount.toLocaleString()} likes</span>
                )}
                {commentCount > 0 && (
                  <span>{commentCount.toLocaleString()} comments</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPostCard;