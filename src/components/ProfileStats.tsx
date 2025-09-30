
import { useState } from "react";

type ProfileStatsProps = {
  userId?: string;
  isNewUser?: boolean;
  followers?: number;
  following?: number;
  likes?: number;
  views?: number;
  posts?: number;
  tipTubeVideos?: number;
  // Add channel data prop
  userChannel?: {
    followers_count?: number;
    following_count?: number;
    posts_count?: number;
    subscribers?: number;
  };
  // Add videos data props
  totalVideos?: number;
  totalShorts?: number;
};

const ProfileStats = ({ 
  userId, 
  isNewUser = false, // Changed default to false
  followers,
  following,
  likes,
  views,
  posts,
  tipTubeVideos,
  userChannel,
  totalVideos = 0,
  totalShorts = 0
}: ProfileStatsProps) => {
  // Use actual data from props, fallback to userChannel data, then to 0
  const stats = {
    posts: posts || userChannel?.posts_count || 0,
    followers: followers || userChannel?.followers_count || userChannel?.subscribers || 0,
    following: following || userChannel?.following_count || 0,
    tipTubeVideos: tipTubeVideos || totalVideos || 0,
    shorts: totalShorts || 0,
    views: views || 0,
    likes: likes || 0,
  };

  return (
    <div className="grid grid-cols-4 divide-x divide-gray-200 py-3 text-center">
      <div className="flex flex-col">
        <span className="text-lg font-bold">{stats.posts}</span>
        <span className="text-xs text-gray-500">Posts</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">{stats.followers}</span>
        <span className="text-xs text-gray-500">Followers</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">{stats.following}</span>
        <span className="text-xs text-gray-500">Following</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">{stats.tipTubeVideos}</span>
        <span className="text-xs text-gray-500">TipTube</span>
      </div>
    </div>
  );
};

export default ProfileStats;
