// src/pages/StartStream.tsx - Start Live Stream Page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamService from '@/services/liveStreamService';
import { Video, ArrowLeft, IndianRupee, Sparkles, Users, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type StreamType = 'free' | 'influencer' | 'promotional';

const streamTypeInfo = {
  free: {
    title: 'Free Stream',
    description: 'Anyone can watch for free',
    icon: '🎉',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  influencer: {
    title: 'Influencer Stream',
    description: 'Charge viewers per minute',
    icon: '⭐',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  promotional: {
    title: 'Promotional Stream',
    description: 'Promote products/services',
    icon: '💰',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
};

const StartStream: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [streamType, setStreamType] = useState<StreamType>('free');
  const [title, setTitle] = useState('');
  const [costPerMinute, setCostPerMinute] = useState<number>(10);
  const [viewerReward, setViewerReward] = useState<number>(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartStream = async () => {
    if (!title.trim()) {
      setError('Please enter a stream title');
      return;
    }

    if (!user?.id) {
      setError('Please login to start streaming');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await LiveStreamService.startStream(user.id, {
        title: title.trim(),
        cost_per_minute: streamType === 'influencer' ? costPerMinute : 0,
        viewer_reward_per_minute: streamType === 'promotional' ? viewerReward : 0,
        is_private: isPrivate,
      });

      if (response.success && response.data) {
        toast({
          title: 'Stream Started!',
          description: 'Your live stream has been created successfully.',
        });

        // Navigate to streaming screen
        navigate('/live-streaming', {
          state: {
            meetingId: response.data.meeting_id,
            token: response.data.token,
            isHost: true,
            streamTitle: title,
            streamType,
          },
        });
      } else {
        setError(response.message || 'Failed to start stream');
      }
    } catch (err: any) {
      console.error('[StartStream] Error:', err);
      setError(err.message || 'Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/livestream')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Start Live Stream</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Stream Configuration</CardTitle>
            <CardDescription>Set up your live stream settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Stream Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Stream Title *</Label>
              <Input
                id="title"
                placeholder="Enter your stream title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-sm text-gray-500">{title.length}/100 characters</p>
            </div>

            {/* Stream Type */}
            <div className="space-y-3">
              <Label>Stream Type *</Label>
              <RadioGroup value={streamType} onValueChange={(value) => setStreamType(value as StreamType)}>
                {Object.entries(streamTypeInfo).map(([key, info]) => (
                  <div key={key} className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer ${streamType === key ? `${info.bgColor} ${info.borderColor}` : 'bg-white border-gray-200'}`}>
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <p className={`font-semibold ${info.color}`}>{info.title}</p>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Cost Per Minute (for Influencer streams) */}
            {streamType === 'influencer' && (
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Per Minute (₹)</Label>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                  <Input
                    id="cost"
                    type="number"
                    min="1"
                    max="100"
                    value={costPerMinute}
                    onChange={(e) => setCostPerMinute(Number(e.target.value))}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Viewers will be charged ₹{costPerMinute} per minute to watch your stream
                </p>
              </div>
            )}

            {/* Viewer Reward (for Promotional streams) */}
            {streamType === 'promotional' && (
              <div className="space-y-2">
                <Label htmlFor="reward">Viewer Reward Per Minute (₹)</Label>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-500" />
                  <Input
                    id="reward"
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={viewerReward}
                    onChange={(e) => setViewerReward(Number(e.target.value))}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Viewers will earn ₹{viewerReward} per minute for watching your promotional stream
                </p>
              </div>
            )}

            {/* Privacy Setting */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {isPrivate ? <Lock className="h-5 w-5 text-gray-600" /> : <Unlock className="h-5 w-5 text-gray-600" />}
                <div>
                  <p className="font-medium">Private Stream</p>
                  <p className="text-sm text-gray-600">
                    {isPrivate ? 'Only invited viewers can join' : 'Anyone can join your stream'}
                  </p>
                </div>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            {/* Start Button */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/livestream')}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleStartStream} disabled={loading || !title.trim()}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Start Stream
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Broadcasting Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Ensure good lighting and a stable internet connection</li>
                <li>• Interact with your viewers regularly</li>
                <li>• Keep your content engaging and professional</li>
                <li>• Test your audio and video before going live</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Monetization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Free streams help build your audience</li>
                <li>• Influencer streams earn you money per viewer minute</li>
                <li>• Promotional streams are paid by sponsors</li>
                <li>• Viewers can send tips during any stream</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StartStream;
