import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, X } from "lucide-react";
import { useComments, useAddComment } from "@/hooks/api";
import { Comment } from "@/types";
import { useAuthUser } from "@/stores/auth.store";
import { getSafeImageUrl, createPlaceholderImage } from "@/utils/imageUtils";
import { toast } from "sonner";

interface CommentsModalProps {
  postId: number;
  open: boolean;
  onClose: () => void;
  postAuthor: string;
  postContent: string;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  postId,
  open,
  onClose,
  postAuthor,
  postContent
}) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthUser();

  const { data: commentsData, isLoading: commentsLoading } = useComments(postId, open);
  const addCommentMutation = useAddComment();

  const comments = commentsData?.data || [];

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        postId,
        content: newComment.trim()
      });
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] rounded-2xl shadow-2xl border-0 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
          <DialogTitle className="text-center text-[15px] font-semibold">
            Comments
          </DialogTitle>
        </DialogHeader>

        {/* Post preview */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={createPlaceholderImage(postAuthor)} />
              <AvatarFallback>{postAuthor.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold mr-2">{postAuthor}</span>
                <span className="text-gray-900 dark:text-gray-100">{postContent}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {commentsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-400 text-xs">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: Comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={getSafeImageUrl(comment.user_profile_image)}
                      alt={comment.user_name || "User"}
                    />
                    <AvatarFallback>
                      {comment.user_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
                      <p className="text-sm">
                        <span className="font-semibold mr-2">{comment.user_name}</span>
                        <span className="text-gray-900 dark:text-gray-100">{comment.comment}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 px-3">
                      <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                      <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                        Reply
                      </button>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-neutral-700">
          <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={getSafeImageUrl(user?.profile_image)}
                alt={user?.name || "You"}
              />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || "Y"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center gap-2">
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border-0 bg-transparent focus:ring-0 focus:border-0 px-0 text-sm placeholder:text-gray-500"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
                className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 p-0 h-auto font-semibold text-sm"
              >
                {isSubmitting ? "..." : "Post"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;