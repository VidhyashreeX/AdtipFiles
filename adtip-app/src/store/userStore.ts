import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  followers: number;
  totalViews: number;
  avatar?: string;
  isPremium: boolean;
  isCallEnabled: boolean; // Added to track if calls are enabled
}

interface Video {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    subscribers: number;
  };
  views: number;
  likes: number;
  duration: string;
  comments: number;
  createdAt: string;
  postedAt: string;
  description: string;
  videoUrl: string;
  category: string;
  isPaidPromotional?: boolean;
}

interface UserState {
  hasChannel: boolean;
  channel: Channel | null;
  videos: Video[];
  createChannel: (name: string, description: string) => void;
  setChannel: (channel: Channel) => void;
  toggleCallEnabled: () => void; // Added to toggle call enabled state
  addVideo: (video: Video) => void;
  followChannel: (channelId: string) => void;
  followedChannels: string[];
  likedVideos: string[];
  likeVideo: (videoId: string) => void;
  unlikeVideo: (videoId: string) => void;
  isVideoLiked: (videoId: string) => boolean;
  isChannelFollowed: (channelId: string) => boolean;
  unfollowChannel: (channelId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      hasChannel: false,
      channel: null,
      videos: [],
      followedChannels: [],
      likedVideos: [],

      createChannel: (name, description) => {
        const newChannel = {
          id: Date.now().toString(),
          name,
          description,
          createdAt: new Date().toISOString(),
          followers: 0,
          totalViews: 0,
          isPremium: false,
          isCallEnabled: false, // Default to false
        };

        set({
          hasChannel: true,
          channel: newChannel,
        });
      },

      setChannel: (channel: Channel) => {
        set({channel});
      },

      toggleCallEnabled: () => {
        const currentChannel = get().channel;
        if (currentChannel) {
          set({
            channel: {
              ...currentChannel,
              isCallEnabled: !currentChannel.isCallEnabled,
            },
          });
        }
      },

      addVideo: (video: Video) => {
        const currentVideos = get().videos;
        set({videos: [...currentVideos, video]});
      },

      followChannel: channelId => {
        const currentFollowed = get().followedChannels;
        if (!currentFollowed.includes(channelId)) {
          set({followedChannels: [...currentFollowed, channelId]});
        }
      },

      unfollowChannel: channelId => {
        const currentFollowed = get().followedChannels;
        set({
          followedChannels: currentFollowed.filter(id => id !== channelId),
        });
      },

      isChannelFollowed: channelId => {
        return get().followedChannels.includes(channelId);
      },

      likeVideo: videoId => {
        const currentLiked = get().likedVideos;
        if (!currentLiked.includes(videoId)) {
          set({likedVideos: [...currentLiked, videoId]});
        }
      },

      unlikeVideo: videoId => {
        const currentLiked = get().likedVideos;
        set({
          likedVideos: currentLiked.filter(id => id !== videoId),
        });
      },

      isVideoLiked: videoId => {
        return get().likedVideos.includes(videoId);
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
