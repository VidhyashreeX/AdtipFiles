// Engagement Demo Component
// Demonstrates the enhanced engagement system features

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import EnhancedLikeButton from './EnhancedLikeButton';
import EnhancedFollowButton from './EnhancedFollowButton';
import EnhancedShareButton from './EnhancedShareButton';
import { Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const EngagementDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-adtip-teal/10 rounded-full">
            <Zap className="h-8 w-8 text-adtip-teal" />
          </div>
          <h1 className="text-3xl font-bold">Enhanced Engagement System</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Experience the improved like, follow, and share functionality with optimistic updates, 
          error recovery, and real-time feedback.
        </p>
      </div>

      {/* Features Overview */}
      <Alert className="border-adtip-teal/20 bg-adtip-teal/5">
        <Zap className="h-4 w-4 text-adtip-teal" />
        <AlertDescription className="text-adtip-teal">
          <strong>✨ New Features:</strong> Instant visual feedback, automatic error recovery, 
          loading states, and consistent state management across all engagement actions.
        </AlertDescription>
      </Alert>

      {/* Demo Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Like Button Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Enhanced Like Button
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Features optimistic updates, loading states, and error recovery.
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Small Size:</span>
                <EnhancedLikeButton
                  postId={1}
                  initialIsLiked={false}
                  initialLikeCount={42}
                  size="sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium Size:</span>
                <EnhancedLikeButton
                  postId={2}
                  initialIsLiked={true}
                  initialLikeCount={128}
                  size="md"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Large Size:</span>
                <EnhancedLikeButton
                  postId={3}
                  initialIsLiked={false}
                  initialLikeCount={1337}
                  size="lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Optimistic Updates</Badge>
                <Badge variant="secondary" className="text-xs">Loading States</Badge>
                <Badge variant="secondary" className="text-xs">Error Recovery</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Follow Button Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Enhanced Follow Button
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Smart state management with hover effects and follower counts.
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Default:</span>
                <EnhancedFollowButton
                  userId={101}
                  initialIsFollowing={false}
                  initialFollowerCount={1250}
                  size="sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Following:</span>
                <EnhancedFollowButton
                  userId={102}
                  initialIsFollowing={true}
                  initialFollowerCount={892}
                  size="sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">With Count:</span>
                <EnhancedFollowButton
                  userId={103}
                  initialIsFollowing={false}
                  initialFollowerCount={5420}
                  size="sm"
                  showCount={true}
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Hover Effects</Badge>
                <Badge variant="secondary" className="text-xs">State Aware</Badge>
                <Badge variant="secondary" className="text-xs">Count Display</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Button Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              Enhanced Share Button
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Multiple share options with fallbacks and success feedback.
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Icon Only:</span>
                <EnhancedShareButton
                  postId={201}
                  postTitle="Amazing Demo Post"
                  showIcon={true}
                  showText={false}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">With Text:</span>
                <EnhancedShareButton
                  postId={202}
                  postTitle="Another Great Post"
                  showIcon={true}
                  showText={true}
                  size="sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Large:</span>
                <EnhancedShareButton
                  postId={203}
                  postTitle="Large Share Button"
                  size="lg"
                  variant="outline"
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Multiple Platforms</Badge>
                <Badge variant="secondary" className="text-xs">Clipboard Fallback</Badge>
                <Badge variant="secondary" className="text-xs">Success Feedback</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-adtip-teal" />
            Key Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Optimistic Updates</h3>
              <p className="text-sm text-gray-600">
                Instant visual feedback before API calls complete, making interactions feel immediate.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Error Recovery</h3>
              <p className="text-sm text-gray-600">
                Automatic state restoration when API calls fail, with user-friendly error messages.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Loading States</h3>
              <p className="text-sm text-gray-600">
                Clear visual indicators during API calls, so users know their actions are being processed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">State Management</h4>
              <p className="text-sm text-gray-600 mb-2">
                Uses Zustand for centralized engagement state with optimistic updates and error recovery.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                useEngagementStore() → toggleLike() → API call → setLikeSuccess() | setLikeError()
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Error Handling</h4>
              <p className="text-sm text-gray-600 mb-2">
                Comprehensive error handling with automatic rollback and user-friendly messages.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                API Error → Revert State → Show Toast → Enable Retry
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Performance</h4>
              <p className="text-sm text-gray-600 mb-2">
                Efficient updates with minimal re-renders and proper cleanup.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                Selective Updates → Batch Operations → Memory Cleanup
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngagementDemo;