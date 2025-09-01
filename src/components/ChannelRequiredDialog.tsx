// src/components/ChannelRequiredDialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChannelRequiredDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateChannel: () => void;
}

export const ChannelRequiredDialog = ({
  open,
  onClose,
  onCreateChannel,
}: ChannelRequiredDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Channel Required</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            You need to create a channel before uploading videos. Please create a
            channel first.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Not Now
            </Button>
            <Button onClick={onCreateChannel}>Create Channel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};