import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';

// Mock data for demonstration
const mockVideos = [
  { id: 1, title: "Amazing Dance Performance", creator: "DanceQueen", views: "1.2M", duration: "0:45", thumbnail: "🎭" },
  { id: 2, title: "Cooking Tips & Tricks", creator: "ChefMaster", views: "856K", duration: "2:15", thumbnail: "👨‍🍳" },
  { id: 3, title: "Tech Review: Latest Phone", creator: "TechGuru", views: "2.1M", duration: "5:30", thumbnail: "📱" },
  { id: 4, title: "Travel Vlog: Paris", creator: "Wanderlust", views: "945K", duration: "8:20", thumbnail: "🗼" },
];

const mockEarnings = {
  totalPoints: 12450,
  todayEarnings: 125,
  videosWatched: 47,
  tasksCompleted: 12,
  referrals: 8
};

const AdTipWebApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.logo}>🎯 AdTip</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.pointsContainer}>
            <Text style={styles.pointsText}>💰 {mockEarnings.totalPoints.toLocaleString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('notifications')}>
            <Text style={styles.headerIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('profile')}>
            <Text style={styles.headerIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos, creators, games..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBottomNavigation = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={[styles.navItem, currentScreen === 'home' && styles.navItemActive]}
        onPress={() => setCurrentScreen('home')}
      >
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={styles.navLabel}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, currentScreen === 'shorts' && styles.navItemActive]}
        onPress={() => setCurrentScreen('shorts')}
      >
        <Text style={styles.navIcon}>🎬</Text>
        <Text style={styles.navLabel}>Shorts</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, currentScreen === 'earn' && styles.navItemActive]}
        onPress={() => setCurrentScreen('earn')}
      >
        <Text style={styles.navIcon}>💰</Text>
        <Text style={styles.navLabel}>Earn</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, currentScreen === 'games' && styles.navItemActive]}
        onPress={() => setCurrentScreen('games')}
      >
        <Text style={styles.navIcon}>🎮</Text>
        <Text style={styles.navLabel}>Games</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, currentScreen === 'wallet' && styles.navItemActive]}
        onPress={() => setCurrentScreen('wallet')}
      >
        <Text style={styles.navIcon}>👛</Text>
        <Text style={styles.navLabel}>Wallet</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHomeScreen = () => (
    <ScrollView style={styles.content}>
      {/* Featured Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {mockVideos.map(video => (
            <TouchableOpacity key={video.id} style={styles.videoCard}>
              <View style={styles.videoThumbnail}>
                <Text style={styles.thumbnailEmoji}>{video.thumbnail}</Text>
                <Text style={styles.videoDuration}>{video.duration}</Text>
              </View>
              <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
              <Text style={styles.videoCreator}>{video.creator}</Text>
              <Text style={styles.videoViews}>{video.views} views</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => setCurrentScreen('earn')}>
            <Text style={styles.quickActionIcon}>👀</Text>
            <Text style={styles.quickActionText}>Watch & Earn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => setCurrentScreen('games')}>
            <Text style={styles.quickActionIcon}>🎲</Text>
            <Text style={styles.quickActionText}>Play Games</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📤</Text>
            <Text style={styles.quickActionText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>👥</Text>
            <Text style={styles.quickActionText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Videos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📺 Recent Videos</Text>
        {mockVideos.map(video => (
          <TouchableOpacity key={`recent-${video.id}`} style={styles.videoListItem}>
            <View style={styles.videoListThumbnail}>
              <Text style={styles.thumbnailEmoji}>{video.thumbnail}</Text>
            </View>
            <View style={styles.videoListInfo}>
              <Text style={styles.videoListTitle}>{video.title}</Text>
              <Text style={styles.videoListMeta}>{video.creator} • {video.views} views</Text>
            </View>
            <TouchableOpacity style={styles.videoListAction}>
              <Text style={styles.videoListActionText}>▶️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderEarnScreen = () => (
    <ScrollView style={styles.content}>
      {/* Earnings Dashboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Your Earnings</Text>
        <View style={styles.earningsGrid}>
          <View style={styles.earningCard}>
            <Text style={styles.earningNumber}>{mockEarnings.totalPoints.toLocaleString()}</Text>
            <Text style={styles.earningLabel}>Total Points</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningNumber}>+{mockEarnings.todayEarnings}</Text>
            <Text style={styles.earningLabel}>Today</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningNumber}>{mockEarnings.videosWatched}</Text>
            <Text style={styles.earningLabel}>Videos Watched</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningNumber}>{mockEarnings.tasksCompleted}</Text>
            <Text style={styles.earningLabel}>Tasks Done</Text>
          </View>
        </View>
      </View>

      {/* Earning Opportunities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Earn More Points</Text>
        <TouchableOpacity style={styles.earnTask}>
          <Text style={styles.earnTaskIcon}>👀</Text>
          <View style={styles.earnTaskInfo}>
            <Text style={styles.earnTaskTitle}>Watch 5 Videos</Text>
            <Text style={styles.earnTaskDesc}>Earn 50 points</Text>
          </View>
          <Text style={styles.earnTaskReward}>+50</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.earnTask}>
          <Text style={styles.earnTaskIcon}>👥</Text>
          <View style={styles.earnTaskInfo}>
            <Text style={styles.earnTaskTitle}>Invite 3 Friends</Text>
            <Text style={styles.earnTaskDesc}>Earn 300 points</Text>
          </View>
          <Text style={styles.earnTaskReward}>+300</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.earnTask}>
          <Text style={styles.earnTaskIcon}>📱</Text>
          <View style={styles.earnTaskInfo}>
            <Text style={styles.earnTaskTitle}>Share App</Text>
            <Text style={styles.earnTaskDesc}>Earn 25 points</Text>
          </View>
          <Text style={styles.earnTaskReward}>+25</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderGamesScreen = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 Gaming Hub</Text>
        <View style={styles.gamesGrid}>
          <TouchableOpacity style={styles.gameCard}>
            <Text style={styles.gameIcon}>🧠</Text>
            <Text style={styles.gameTitle}>Quiz Master</Text>
            <Text style={styles.gameReward}>Win up to 100 pts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gameCard}>
            <Text style={styles.gameIcon}>🎰</Text>
            <Text style={styles.gameTitle}>Lucky Spin</Text>
            <Text style={styles.gameReward}>Win up to 500 pts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gameCard}>
            <Text style={styles.gameIcon}>🃏</Text>
            <Text style={styles.gameTitle}>Memory Game</Text>
            <Text style={styles.gameReward}>Win up to 75 pts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gameCard}>
            <Text style={styles.gameIcon}>🔤</Text>
            <Text style={styles.gameTitle}>Word Puzzle</Text>
            <Text style={styles.gameReward}>Win up to 150 pts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
        <View style={styles.leaderboard}>
          <View style={styles.leaderboardItem}>
            <Text style={styles.leaderboardRank}>1</Text>
            <Text style={styles.leaderboardName}>GameMaster</Text>
            <Text style={styles.leaderboardScore}>15,420 pts</Text>
          </View>
          <View style={styles.leaderboardItem}>
            <Text style={styles.leaderboardRank}>2</Text>
            <Text style={styles.leaderboardName}>QuizKing</Text>
            <Text style={styles.leaderboardScore}>14,890 pts</Text>
          </View>
          <View style={styles.leaderboardItem}>
            <Text style={styles.leaderboardRank}>3</Text>
            <Text style={styles.leaderboardName}>PuzzlePro</Text>
            <Text style={styles.leaderboardScore}>13,750 pts</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderWalletScreen = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👛 Wallet</Text>
        <View style={styles.walletBalance}>
          <Text style={styles.balanceAmount}>{mockEarnings.totalPoints.toLocaleString()}</Text>
          <Text style={styles.balanceLabel}>Available Points</Text>
        </View>
        
        <View style={styles.walletActions}>
          <TouchableOpacity style={styles.walletAction}>
            <Text style={styles.walletActionIcon}>💸</Text>
            <Text style={styles.walletActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletAction}>
            <Text style={styles.walletActionIcon}>🎁</Text>
            <Text style={styles.walletActionText}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletAction}>
            <Text style={styles.walletActionIcon}>📊</Text>
            <Text style={styles.walletActionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
        <View style={styles.transaction}>
          <Text style={styles.transactionIcon}>👀</Text>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>Watched Video</Text>
            <Text style={styles.transactionTime}>2 hours ago</Text>
          </View>
          <Text style={styles.transactionAmount}>+10</Text>
        </View>
        
        <View style={styles.transaction}>
          <Text style={styles.transactionIcon}>🎮</Text>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>Quiz Completed</Text>
            <Text style={styles.transactionTime}>5 hours ago</Text>
          </View>
          <Text style={styles.transactionAmount}>+50</Text>
        </View>
        
        <View style={styles.transaction}>
          <Text style={styles.transactionIcon}>👥</Text>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>Friend Referral</Text>
            <Text style={styles.transactionTime}>1 day ago</Text>
          </View>
          <Text style={styles.transactionAmount}>+100</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return renderHomeScreen();
      case 'shorts':
        return renderHomeScreen(); // For demo, showing same content
      case 'earn':
        return renderEarnScreen();
      case 'games':
        return renderGamesScreen();
      case 'wallet':
        return renderWalletScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderCurrentScreen()}
      {renderBottomNavigation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  pointsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  headerIcon: {
    fontSize: 20,
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    padding: 5,
  },
  searchIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  videoCard: {
    width: 160,
    marginRight: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoThumbnail: {
    height: 90,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  thumbnailEmoji: {
    fontSize: 30,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  videoCreator: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  videoViews: {
    fontSize: 11,
    color: '#9ca3af',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  quickAction: {
    width: '22%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  videoListItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  videoListThumbnail: {
    width: 60,
    height: 45,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoListInfo: {
    flex: 1,
  },
  videoListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  videoListMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  videoListAction: {
    padding: 8,
  },
  videoListActionText: {
    fontSize: 16,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  earningCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5,
  },
  earningLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  earnTask: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earnTaskIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  earnTaskInfo: {
    flex: 1,
  },
  earnTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  earnTaskDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  earnTaskReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  gameCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
    textAlign: 'center',
  },
  gameReward: {
    fontSize: 12,
    color: '#10b981',
    textAlign: 'center',
  },
  leaderboard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  leaderboardRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    width: 30,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 15,
  },
  leaderboardScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  walletBalance: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  walletAction: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  walletActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  transaction: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#ede9fe',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
});

export default AdTipWebApp;