// Enhanced Like Button Component
// Provides optimistic UI updates, loading states, and error handling

import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useEnhancedLike } from '../../hooks/useEnhancedEngagement';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { cn } from '../../lib/utils';

export interface EnhancedLikeButtonProps {
  postId: number;
  initialIsLiked?: boolean;
  initialLikeCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  disabled?: boolean;
}

const EnhancedLikeButton: React.FC<EnhancedLikeButtonProps> = ({
  postId,
  initialIsLiked = false,
  initialLikeCount = 0,
  size = 'md',
  showCount = true,
  className,
  onLikeChange,
  disabled = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();

  const { isLiked, likeCount, isLoading, handleLike } = useEnhancedLike({
    postId,
    initialIsLiked,
    initialLikeCount,
    onSuccess: onLikeChange,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!disabled && !isLoading) {
      handleLike();
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-xs',
      padding: 'p-1',
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-sm',
      padding: 'p-2',
    },
    lg: {
      icon: 'w-6 h-6',
      text: 'text-base',
      padding: 'p-3',
    },
  };

  const config = sizeConfig[size];

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'group relative flex items-center gap-2 transition-all duration-200 rounded-full',
        'hover:bg-red-50 dark:hover:bg-red-900/20',
        'focus:outline-none focus:ring-2 focus:ring-red-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        config.padding,
        className
      )}
      aria-label={isLiked ? 'Unlike post' : 'Like post'}
    >
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className={cn('animate-spin text-red-500', config.icon)} />
        </div>
      )}

      {/* Heart icon */}
      <div className={cn('transition-all duration-200', isLoading && 'opacity-0')}>
        <Heart
          className={cn(
            'transition-all duration-200',
            config.icon,
            isLiked
              ? 'text-red-500 fill-red-500 scale-110'
              : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500 group-hover:scale-110'
          )}
          fill={isLiked ? 'currentColor' : 'none'}
          strokeWidth={isLiked ? '0' : '1.5'}
        />
      </div>

      {/* Like count */}
      {showCount && (
        <span
          className={cn(
            'font-medium transition-all duration-200',
            config.text,
            isLiked
              ? 'text-red-500'
              : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500',
            isLoading && 'opacity-50'
          )}
        >
          {likeCount.toLocaleString()}
        </span>
      )}

      {/* Ripple effect for feedback */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-red-500 opacity-0 scale-0',
          'group-active:opacity-20 group-active:scale-100 group-active:animate-ping',
          'transition-all duration-200'
        )}
      />
    </button>
  );
};

export default EnhancedLikeButton;