import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const AdTipWebApp = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 AdTip</Text>
        <Text style={styles.subtitle}>Social Media & Rewards Platform</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Video Feed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎥 Video Feed</Text>
          <Text style={styles.description}>
            Watch trending videos and earn rewards
          </Text>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>📹 Video Player</Text>
            <Text style={styles.placeholderSubtext}>Tap to play videos</Text>
          </View>
        </View>

        {/* Rewards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Earn Rewards</Text>
          <Text style={styles.description}>
            Complete tasks and earn points
          </Text>
          <View style={styles.rewardsGrid}>
            <TouchableOpacity style={styles.rewardCard}>
              <Text style={styles.rewardEmoji}>👀</Text>
              <Text style={styles.rewardText}>Watch Videos</Text>
              <Text style={styles.rewardPoints}>+10 pts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rewardCard}>
              <Text style={styles.rewardEmoji}>✅</Text>
              <Text style={styles.rewardText}>Complete Tasks</Text>
              <Text style={styles.rewardPoints}>+25 pts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gaming Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Gaming Hub</Text>
          <Text style={styles.description}>
            Play games and win prizes
          </Text>
          <View style={styles.gameGrid}>
            {['Quiz Master', 'Lucky Spin', 'Memory Game', 'Word Puzzle'].map((game, index) => (
              <TouchableOpacity key={index} style={styles.gameCard}>
                <Text style={styles.gameEmoji}>🎲</Text>
                <Text style={styles.gameText}>{game}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Social Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Social</Text>
          <Text style={styles.description}>
            Connect with friends and share content
          </Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialEmoji}>👫</Text>
              <Text style={styles.socialText}>Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialEmoji}>💬</Text>
              <Text style={styles.socialText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialEmoji}>📊</Text>
              <Text style={styles.socialText}>Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Dashboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1,234</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>56</Text>
              <Text style={styles.statLabel}>Videos Watched</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🌐 AdTip Web Preview - Full features available in mobile app
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e7ff',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#d1d5db',
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  rewardEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  rewardText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  rewardPoints: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '500',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameCard: {
    width: '48%',
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gameEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  gameText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  socialText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#374151',
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AdTipWebApp;