import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {Header} from '@/components/common/Header';
import {SideMenu} from '@/components/layout/SideMenu';
import {StoryItem} from '@/components/home/StoryItem';
import {EarnCard} from '@/components/home/EarnCard';
import {CategoryItem} from '@/components/home/CategoryItem';
import {PostItem} from '@/components/home/PostItem';
import {Play, Video} from 'lucide-react-native';
import {useRouter, useFocusEffect} from 'expo-router';
import * as Linking from 'expo-linking';

interface Story {
  id: string;
  username: string;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  user_name: string;
  user_profile_image: string | null;
  likeCount: number;
  commentCount: number;
  is_promoted?: number;
}

const API_URL = 'http://3.6.15.198:7082';
const PUBSCALE_BASE_URL = 'https://wow.pubscale.com';
const PUBSCALE_APP_ID = '39604779';

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState({
    stories: true,
    categories: false,
    posts: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
  const router = useRouter();

  const getFullImageUrl = (url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchStories = async () => {
    try {
      setLoading(prev => ({...prev, stories: true}));
      const storiesUrl = `${API_URL}/api/list-stories`;
      const response = await fetch(storiesUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Stories HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result && Array.isArray(result.data)) {
        const fetchedStories = result.data.map((story: any) => ({
          ...story,
          imageUrl: getFullImageUrl(story.imageUrl),
        }));
        setStories(fetchedStories);
      } else {
        setStories([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Stories fetch error:', err);
      setError(`An error occurred while fetching stories: ${errorMessage}`);
    } finally {
      setLoading(prev => ({...prev, stories: false}));
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(prev => ({...prev, posts: true}));
      const premiumUrl = `${API_URL}/api/list-premium-posts`;
      const premiumResponse = await fetch(premiumUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!premiumResponse.ok) {
        throw new Error(
          `Premium posts HTTP error! Status: ${premiumResponse.status}`,
        );
      }

      const premiumResult = await premiumResponse.json();
      let allPosts: Post[] = [];
      if (premiumResult && Array.isArray(premiumResult.data)) {
        allPosts = premiumResult.data.map((post: any) => ({
          ...post,
          user_profile_image: getFullImageUrl(post.user_profile_image),
          media_url: getFullImageUrl(post.media_url),
        }));
      }

      const regularUrl = `${API_URL}/api/list-post`;
      const regularResponse = await fetch(regularUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (regularResponse.ok) {
        const regularResult = await regularResponse.json();
        if (regularResult && Array.isArray(regularResult.data)) {
          const regularPosts = regularResult.data.map((post: any) => ({
            ...post,
            user_profile_image: getFullImageUrl(post.user_profile_image),
            media_url: getFullImageUrl(post.media_url),
          }));
          allPosts = [...allPosts, ...regularPosts];
        }
      }

      if (allPosts.length === 0) {
        setError('No posts available at the moment. Please try again later.');
      } else {
        setPosts(allPosts);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Posts fetch error:', err);
      setError(`An error occurred while fetching posts: ${errorMessage}`);
    } finally {
      setLoading(prev => ({...prev, posts: false}));
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, []),
  );

  useEffect(() => {
    fetchStories();
    fetchPosts();
  }, []);

  const openLink = async () => {
    const userId = 'guest';
    const finalUrl = `${PUBSCALE_BASE_URL}?app_id=${PUBSCALE_APP_ID}&user_id=${userId}`;

    try {
      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
        console.log('Pubscale URL opened successfully');
        return true;
      } else {
        console.log('Cannot open URL:', finalUrl);
        return false;
      }
    } catch (e) {
      console.error('Failed to launch URL:', e);
      return false;
    }
  };

  const handleWatchAndEarn = async () => {
    await openLink();
  };

  const handleLike = (postId: number) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {...post, likeCount: post.likeCount + (likedPosts[postId] ? -1 : 1)}
          : post,
      ),
    );
  };

  const handleComment = (postId: number) => {
    console.log(`Commenting on post ${postId}`);
  };

  const handleShare = (postId: number) => {
    console.log(`Sharing post ${postId}`);
  };

  const handleStoryPress = (storyId: string) => {
    console.log(`Viewing story ${storyId}`);
  };

  const handleAddStory = () => {
    console.log('Adding a new story');
  };

  const handleProfilePress = () => {
    console.log('Navigating to profile');
  };

  const handleWalletPress = () => {
    console.log('Accessing wallet');
  };

  const handleFollow = async (userId: number) => {
    console.log(`Following user ${userId}`);
    return Promise.resolve();
  };

  return (
    <View style={styles.container}>
      <Header
        showSearch={true}
        searchPlaceholder="Search user"
        walletAmount="0.00"
        onMenuPress={() => setMenuVisible(true)}
        onWalletPress={handleWalletPress}
        onProfilePress={handleProfilePress}
        onSearchChange={text => console.log('Search:', text)}
      />

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storiesContainer}
          contentContainerStyle={styles.storiesContent}>
          <StoryItem isAddStory={true} onPress={handleAddStory} />
          {loading.stories ? (
            <ActivityIndicator
              size="small"
              color="#24d05a"
              style={styles.storyLoader}
            />
          ) : stories.length === 0 ? (
            <Text style={styles.noStoriesText}>No stories available</Text>
          ) : (
            stories.map(story => (
              <StoryItem
                key={story.id}
                username={story.username}
                imageUrl={story.imageUrl}
                onPress={() => handleStoryPress(story.id)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.earnCardsContainer}>
          <EarnCard
            title="Watch & Earn"
            description="Earn rewards by watching videos"
            icon={<Video size={24} color="#24d05a" />}
            onPress={handleWatchAndEarn}
          />
          <EarnCard
            title="Play & Earn"
            description="Earn money by playing games"
            icon={<Play size={24} color="#24d05a" />}
            onPress={() => console.log('Play & Earn pressed')}
          />
        </View>

        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested for you</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Top</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}>
            <CategoryItem
              name="All"
              selected={!selectedCategory}
              onPress={() => setSelectedCategory(null)}
            />
            <CategoryItem
              name="Following"
              selected={selectedCategory === 'following'}
              onPress={() => setSelectedCategory('following')}
            />
            <CategoryItem
              name="Trending"
              selected={selectedCategory === 'trending'}
              onPress={() => setSelectedCategory('trending')}
            />
          </ScrollView>
        </View>

        <View style={styles.postsContainer}>
          {loading.posts ? (
            <ActivityIndicator
              size="large"
              color="#24d05a"
              style={styles.loader}
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : posts.length === 0 ? (
            <Text style={styles.noPostsText}>No posts available</Text>
          ) : (
            posts.map(post => (
              <PostItem
                key={post.id}
                username={post.user_name}
                profileImage={
                  post.user_profile_image ||
                  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
                }
                postImage={post.media_url}
                caption={post.content}
                likes={post.likeCount}
                comments={post.commentCount}
                timeAgo="Just now"
                onLike={() => handleLike(post.id)}
                onComment={() => handleComment(post.id)}
                onShare={() => handleShare(post.id)}
                onPress={handleProfilePress}
                onFollow={() => handleFollow(post.user_id)}
                isPremium={'is_promoted' in post && post.is_promoted === 1}
                media_type={post.media_type}
              />
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 20,
  },
  content: {
    flex: 1,
  },
  storiesContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  storiesContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  storyLoader: {
    marginHorizontal: 16,
  },
  noStoriesText: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 16,
  },
  earnCardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  categoriesScroll: {
    paddingLeft: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  postsContainer: {
    flex: 1,
  },
  bottomPadding: {
    height: 80,
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginVertical: 20,
  },
  noPostsText: {
    textAlign: 'center',
    color: '#0f172a',
    fontSize: 16,
    marginVertical: 20,
  },
});
