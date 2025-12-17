// Live Stream Comparison Demo - Shows OLD vs NEW features
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  MessageCircle, 
  Users, 
  Clock, 
  Eye, 
  IndianRupee,
  Heart,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LiveStreamComparison: React.FC = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState<'old' | 'new'>('new');

  // Mock data for demonstration
  const mockStreamData = {
    title: "Demo Live Stream",
    viewerCount: 42,
    duration: "15:30",
    earnings: 150,
    cost: 25,
    isConnected: true,
    reconnectAttempts: 0,
  };

  const mockChatMessages = [
    { id: '1', user: 'Alice', message: 'Hello everyone!', type: 'message', timestamp: Date.now() - 60000 },
    { id: '2', user: 'Bob', message: 'Great stream!', type: 'message', timestamp: Date.now() - 30000 },
    { id: '3', user: 'Charlie', message: 'Sent a tip of ₹50', type: 'tip', tipAmount: 50, timestamp: Date.now() - 10000 },
    { id: '4', user: 'System', message: 'David joined the stream', type: 'system', timestamp: Date.now() - 5000 },
  ];

  const OldStreamingDemo = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            OLD: Basic Chat (No Real-time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 h-40 overflow-y-auto bg-gray-50 p-3 rounded">
            <div className="bg-white p-2 rounded text-sm">
              <strong>Alice:</strong> Hello everyone!
            </div>
            <div className="bg-white p-2 rounded text-sm">
              <strong>Bob:</strong> Great stream!
            </div>
            <p className="text-xs text-gray-500 text-center">
              ❌ Messages don't update in real-time
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <input 
              className="flex-1 px-3 py-2 border rounded" 
              placeholder="Type message..." 
              disabled 
            />
            <Button disabled>Send</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OLD: Static Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <Users className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Viewers</p>
              <p className="font-bold">? (Unknown)</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <Clock className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Duration</p>
              <p className="font-bold">? (Static)</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <Badge variant="secondary">❌ No Connection Status</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NewStreamingDemo = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              NEW: Real-time Chat with WebSocket
            </div>
            <Badge className="bg-green-600 text-white">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 h-40 overflow-y-auto bg-gray-50 p-3 rounded">
            {mockChatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-2 rounded text-sm ${
                  msg.type === 'tip' ? 'bg-yellow-100 border border-yellow-300' :
                  msg.type === 'system' ? 'bg-blue-100 border border-blue-300' :
                  'bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <strong className="text-blue-600">{msg.user}</strong>
                  {msg.type === 'tip' && (
                    <Badge className="bg-yellow-500 text-white text-xs">
                      ₹{msg.tipAmount}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <Button variant="outline" size="sm" className="w-full">
              <Heart className="h-4 w-4 mr-2" />
              Send Tip (NEW Feature)
            </Button>
            <div className="flex gap-2">
              <input 
                className="flex-1 px-3 py-2 border rounded" 
                placeholder="Type message..." 
              />
              <Button>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NEW: Real-time Statistics & Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded border border-green-200">
              <Eye className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-sm">Live Viewers</p>
              <p className="font-bold text-green-600">{mockStreamData.viewerCount}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
              <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-sm">Duration</p>
              <p className="font-bold text-blue-600">{mockStreamData.duration}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
              <IndianRupee className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-sm">Earnings</p>
              <p className="font-bold text-purple-600">₹{mockStreamData.earnings}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm">✅ WebSocket Connection</span>
              <Badge className="bg-green-600 text-white">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm">✅ Balance Monitoring</span>
              <Badge className="bg-blue-600 text-white">Monitoring</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <span className="text-sm">✅ Auto-reconnection</span>
              <Badge className="bg-purple-600 text-white">Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Live Streaming: OLD vs NEW</h1>
          <p className="text-gray-600 mb-6">
            Compare the old basic streaming with the new enhanced real-time features
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={activeDemo === 'old' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('old')}
            >
              <X className="h-4 w-4 mr-2" />
              OLD Version
            </Button>
            <Button
              variant={activeDemo === 'new' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('new')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              NEW Enhanced
            </Button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* OLD Version */}
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="destructive" className="mb-4">
                OLD: Basic Streaming
              </Badge>
              <h2 className="text-xl font-semibold mb-4">What You Were Seeing Before</h2>
            </div>
            <OldStreamingDemo />
            
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-red-800 mb-2">❌ Missing Features:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• No real-time chat delivery</li>
                  <li>• Static viewer counts</li>
                  <li>• No connection status</li>
                  <li>• No balance monitoring</li>
                  <li>• No tip system</li>
                  <li>• No auto-reconnection</li>
                  <li>• Basic error handling</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* NEW Version */}
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="bg-green-600 text-white mb-4">
                NEW: Enhanced Streaming
              </Badge>
              <h2 className="text-xl font-semibold mb-4">What You Get Now</h2>
            </div>
            <NewStreamingDemo />
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-green-800 mb-2">✅ New Features Added:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Real-time WebSocket chat</li>
                  <li>• Live viewer count updates</li>
                  <li>• Connection status indicator</li>
                  <li>• Automatic balance monitoring</li>
                  <li>• Real-time tip system</li>
                  <li>• Auto-reconnection on disconnect</li>
                  <li>• Enhanced error recovery</li>
                  <li>• Stream validation</li>
                  <li>• Session duration tracking</li>
                  <li>• Real-time earnings display</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8 space-y-4">
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => navigate('/livestream')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Live Streams (Enhanced)
            </Button>
            <Button 
              onClick={() => navigate('/start-stream')}
              className="bg-green-600 hover:bg-green-700"
            >
              Start New Stream (Enhanced)
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>💡 <strong>Tip:</strong> When you join a stream from the list, you'll use the NEW enhanced component</p>
            <p>🔧 <strong>Note:</strong> WebSocket features need backend WebSocket endpoint to be fully functional</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamComparison;