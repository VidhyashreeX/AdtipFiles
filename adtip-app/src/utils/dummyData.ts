export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: Channel;
  views: number;
  postedAt: string;
  duration: string;
  description: string;
  videoUrl: string;
  likes: number;
  comments: number;
}

export interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  verified: boolean;
}

export interface Short {
  id: string;
  videoUrl: string;
  channel: Channel;
  description: string;
  likes: number;
  comments: number;
}

export interface Category {
  id: string;
  name: string;
}

export const categories: Category[] = [
  {id: '1', name: 'All'},
  {id: '2', name: 'Trend'},
  {id: '3', name: 'Comedy'},
  {id: '4', name: 'Dev'},
  {id: '5', name: 'Music'},
  {id: '6', name: 'Gaming'},
  {id: '7', name: 'Crypto'},
  {id: '8', name: 'Finance'},
];

export const channels: Channel[] = [
  {
    id: '1',
    name: 'TechGuru',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    subscribers: 1200000,
    verified: true,
  },
  {
    id: '2',
    name: 'FitnessCoach',
    avatar:
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    subscribers: 850000,
    verified: true,
  },
  {
    id: '3',
    name: 'CookingMaster',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    subscribers: 675000,
    verified: true,
  },
  {
    id: '4',
    name: 'TravelExplorer',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    subscribers: 950000,
    verified: true,
  },
];

export const videos: Video[] = [
  {
    id: '1',
    title: 'How to Build a Website in 2025 - Complete Guide',
    thumbnail:
      'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg',
    channel: channels[0],
    views: 1254789,
    postedAt: '2023-11-15T12:00:00Z',
    duration: '14:25',
    description:
      'Learn how to build a modern website from scratch using the latest technologies. This tutorial covers everything you need to know to get started.',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    likes: 45678,
    comments: 3456,
  },
  {
    id: '2',
    title: '10 Minute Full Body Workout - No Equipment Needed',
    thumbnail:
      'https://images.pexels.com/photos/4498292/pexels-photo-4498292.jpeg',
    channel: channels[1],
    views: 2345678,
    postedAt: '2023-10-28T15:30:00Z',
    duration: '10:15',
    description:
      'Get fit at home with this effective 10-minute full body workout that requires no equipment. Perfect for beginners and advanced fitness enthusiasts.',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    likes: 67890,
    comments: 4567,
  },
  {
    id: '3',
    title: '5 Easy Pasta Recipes for Beginners',
    thumbnail:
      'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
    channel: channels[2],
    views: 1876543,
    postedAt: '2023-09-12T09:15:00Z',
    duration: '18:30',
    description:
      'Learn how to make 5 delicious pasta dishes that are perfect for beginners. These recipes are quick, easy, and require minimal ingredients.',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    likes: 56789,
    comments: 2345,
  },
  {
    id: '4',
    title: 'Top 10 Hidden Gems in Europe - Travel Guide',
    thumbnail:
      'https://images.pexels.com/photos/1485894/pexels-photo-1485894.jpeg',
    channel: channels[3],
    views: 3456789,
    postedAt: '2023-08-25T18:45:00Z',
    duration: '22:10',
    description:
      "Discover the most beautiful hidden places in Europe that most tourists don't know about. This guide will help you plan your next European adventure.",
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    likes: 78901,
    comments: 5678,
  },
  {
    id: '5',
    title: 'React Native Tutorial for Beginners - Build Your First App',
    thumbnail:
      'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg',
    channel: channels[0],
    views: 987654,
    postedAt: '2023-12-05T14:20:00Z',
    duration: '25:45',
    description:
      'Learn how to build your first mobile app using React Native. This comprehensive tutorial covers everything from setup to deployment.',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    likes: 34567,
    comments: 2345,
  },
  {
    id: '6',
    title: 'Yoga for Beginners - 20 Minute Routine',
    thumbnail:
      'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg',
    channel: channels[1],
    views: 1234567,
    postedAt: '2024-01-10T08:30:00Z',
    duration: '20:05',
    description:
      'Start your yoga journey with this gentle 20-minute routine designed for beginners. Improve flexibility, strength, and mental clarity.',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    likes: 56789,
    comments: 3456,
  },
];

export const shorts: Short[] = [
  {
    id: '1',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    channel: channels[0],
    description:
      'Quick tech tip that will save you hours of work! #techtips #productivity',
    likes: 45678,
    comments: 1234,
  },
  {
    id: '2',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    channel: channels[1],
    description:
      '30-second plank challenge! Can you do it? #fitness #challenge',
    likes: 67890,
    comments: 2345,
  },
  {
    id: '3',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    channel: channels[2],
    description: 'The secret to perfect pasta every time! #cooking #foodhack',
    likes: 34567,
    comments: 1234,
  },
  {
    id: '4',
    videoUrl:
      'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    channel: channels[3],
    description: 'This hidden beach in Greece is a must-visit! #travel #greece',
    likes: 56789,
    comments: 2345,
  },
];
