import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface BecomePremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BecomePremiumDialog: React.FC<BecomePremiumDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/premium'); // Navigate to the premium subscription page
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="pt-2">
            To upload paid content and access exclusive features, you need to be a premium member.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            Unlock powerful tools for creators by upgrading your account. Monetize your content and reach a wider audience.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:flex-1">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="sm:flex-1 bg-yellow-500 hover:bg-yellow-600 text-black">
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BecomePremiumDialog;
