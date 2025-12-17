// Enhanced Share Button Component
// Provides loading states, multiple share options, and error handling

import React, { useState } from 'react';
import { Share2, Link, Copy, Loader2, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { useEnhancedShare } from '../../hooks/useEnhancedEngagement';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export interface EnhancedShareButtonProps {
  postId: number;
  postTitle?: string;
  postUrl?: string;
  postDescription?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onShare?: (platform: string) => void;
  disabled?: boolean;
}

const EnhancedShareButton: React.FC<EnhancedShareButtonProps> = ({
  postId,
  postTitle = 'Check out this post',
  postUrl,
  postDescription,
  size = 'md',
  variant = 'ghost',
  showIcon = true,
  showText = false,
  className,
  onShare,
  disabled = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { isLoading, handleShare } = useEnhancedShare({
    postId,
    postTitle,
    postUrl,
    onSuccess: () => {
      setIsDropdownOpen(false);
      onShare?.('native');
    },
  });

  const shareUrl = postUrl || `${window.location.origin}/post/${postId}`;
  const shareText = postDescription || postTitle;

  // Share to specific platforms
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    onShare?.('twitter');
    setIsDropdownOpen(false);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
    onShare?.('facebook');
    setIsDropdownOpen(false);
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    onShare?.('whatsapp');
    setIsDropdownOpen(false);
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = `${shareText}\n${shareUrl}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      toast.success('Link copied to clipboard!');
      onShare?.('clipboard');
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeConfig[size];

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled || isLoading}
          size={size}
          variant={variant}
          className={cn(
            'transition-all duration-200',
            'hover:bg-blue-50 dark:hover:bg-blue-900/20',
            'focus:ring-2 focus:ring-blue-500/20',
            className
          )}
          aria-label="Share post"
        >
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className={cn('animate-spin', iconSize)} />
            ) : (
              showIcon && <Share2 className={iconSize} />
            )}
            {showText && (
              <span className={isLoading ? 'opacity-50' : ''}>
                {isLoading ? 'Sharing...' : 'Share'}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* Native share (if available) */}
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
              <Share2 className="w-4 h-4 mr-2" />
              Share...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Copy link */}
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Social platforms */}
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <Facebook className="w-4 h-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedShareButton;