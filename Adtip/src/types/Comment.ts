export interface Comment {
  id: number;
  post_id?: number;
  video_id?: number;
  user_id: number;
  user_name: string;
  user_profile_image?: string;
  content: string;
  comment: string; // For backward compatibility
  like_count: number;
  reply_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at?: string;
  parent_id: number | null;
  replies?: Comment[];
  // Video-specific fields
  commentator_name?: string;
  commentator_image?: string;
  total_comment_like?: number;
}

export interface CommentAPIResponse {
  status: boolean;
  message: string;
  data?: Comment[] | Comment;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

export interface AddCommentRequest {
  postId?: number;
  videoId?: number;
  userId: number;
  content: string;
  parentId?: number | null;
}

export interface LikeCommentRequest {
  commentId: number;
  userId: number;
  is_liked: boolean;
}

export interface DeleteCommentRequest {
  commentId: number;
  userId: number;
  postId?: number;
  videoId?: number;
}
