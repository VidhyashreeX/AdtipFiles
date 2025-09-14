// src/pages/createChannel.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createChannel } from '../services/channelService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CreateChannel = () => {
  const [name, setName] = useState('');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async () => {
    try {
      const channelId = await createChannel(String(user.id), name);
      updateUser({ channelId }); // Update context
      navigate(location.state?.returnTo || '/home'); // Return to previous page
    } catch (error: any) {
      toast.error('Channel creation failed: ' + (error?.message || error));
    }
  };

  return (
    <div className="p-5 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Create Your Channel</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="channel-name">Channel Name</Label>
          <Input
            id="channel-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            placeholder="e.g., My Awesome Channel"
          />
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full"
        >
          Create Channel
        </Button>
      </div>
    </div>
  );
};

export default CreateChannel;