
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
};

const ProfileStats = ({ 
  userId, 
  isNewUser = true,
  followers,
  following,
  likes,
  views,
  posts,
  tipTubeVideos
}: ProfileStatsProps) => {
  const [stats] = useState({
    posts: posts || (isNewUser ? 0 : 42),
    followers: followers || (isNewUser ? 0 : 1024),
    following: following || (isNewUser ? 0 : 365),
    likes: likes || (isNewUser ? 0 : 2048),
    views: views || (isNewUser ? 0 : 50000),
    tipTubeVideos: tipTubeVideos || (isNewUser ? 0 : 12),
  });

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
