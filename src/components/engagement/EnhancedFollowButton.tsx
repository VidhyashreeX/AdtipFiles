// Enhanced Follow Button Component
// Provides optimistic UI updates, loading states, and error handling

import React from 'react';
import { UserPlus, UserMinus, Loader2, Check } from 'lucide-react';
import { useEnhancedFollow } from '../../hooks/useEnhancedEngagement';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface EnhancedFollowButtonProps {
  userId: number;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showCount?: boolean;
  showIcon?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
  disabled?: boolean;
}

const EnhancedFollowButton: React.FC<EnhancedFollowButtonProps> = ({
  userId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  size = 'md',
  variant = 'default',
  showCount = false,
  showIcon = true,
  className,
  onFollowChange,
  disabled = false,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { openLoginModal } = useAuthModal();

  const { isFollowing, followerCount, isLoading, handleFollow } = useEnhancedFollow({
    userId,
    initialIsFollowing,
    initialFollowerCount,
    onSuccess: onFollowChange,
  });

  // Don't show follow button for own profile
  if (user?.id === userId) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!disabled && !isLoading) {
      handleFollow();
    }
  };

  // Button text and styling based on state
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      );
    }

    if (isFollowing) {
      return (
        <>
          {showIcon && <Check className="w-4 h-4" />}
          Following
          {showCount && followerCount > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({followerCount.toLocaleString()})
            </span>
          )}
        </>
      );
    }

    return (
      <>
        {showIcon && <UserPlus className="w-4 h-4" />}
        Follow
        {showCount && followerCount > 0 && (
          <span className="ml-1 text-xs opacity-75">
            ({followerCount.toLocaleString()})
          </span>
        )}
      </>
    );
  };

  // Button variant styling
  const getButtonVariant = () => {
    if (isFollowing) {
      return variant === 'default' ? 'outline' : variant;
    }
    return variant;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      size={size}
      variant={getButtonVariant()}
      className={cn(
        'relative transition-all duration-200',
        'focus:ring-2 focus:ring-adtip-teal/20',
        isFollowing
          ? 'hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20'
          : 'bg-adtip-teal hover:bg-adtip-teal/90 text-white border-adtip-teal',
        className
      )}
      aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
    >
      <div className="flex items-center gap-2">
        {getButtonContent()}
      </div>

      {/* Hover effect for unfollow */}
      {isFollowing && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-2 text-red-600">
            {showIcon && <UserMinus className="w-4 h-4" />}
            Unfollow
          </div>
        </div>
      )}
    </Button>
  );
};

export default EnhancedFollowButton;