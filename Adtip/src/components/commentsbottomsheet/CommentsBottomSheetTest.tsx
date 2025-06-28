import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import CommentsBottomSheet from './CommentsBottomSheet';

const CommentsBottomSheetTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [commentCount, setCommentCount] = useState(5);

  const handleOpenComments = () => {
    try {
      setIsVisible(true);
    } catch (error) {
      console.error('Error opening comments:', error);
      Alert.alert('Error', 'Failed to open comments');
    }
  };

  const handleCloseComments = () => {
    try {
      setIsVisible(false);
    } catch (error) {
      console.error('Error closing comments:', error);
      Alert.alert('Error', 'Failed to close comments');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Instagram-Style Comments Demo</Text>
        <Text style={styles.subtitle}>
          Tap the button below to open the comments bottom sheet
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenComments}
        >
          <Text style={styles.buttonText}>
            Open Comments ({commentCount})
          </Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.feature}>• Smooth draggable bottom sheet</Text>
          <Text style={styles.feature}>• Scrollable comments list</Text>
          <Text style={styles.feature}>• Fixed input at bottom</Text>
          <Text style={styles.feature}>• Keyboard-aware positioning</Text>
          <Text style={styles.feature}>• Instagram-like animations</Text>
          <Text style={styles.feature}>• Crash-resistant implementation</Text>
        </View>

        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.note}>• Simplified gesture handling to prevent crashes</Text>
          <Text style={styles.note}>• Removed complex animations that cause issues</Text>
          <Text style={styles.note}>• Stable keyboard handling</Text>
        </View>
      </View>

      <CommentsBottomSheet
        visible={isVisible}
        postId={1}
        onClose={handleCloseComments}
        initialCommentCount={commentCount}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  feature: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  notes: {
    alignSelf: 'stretch',
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#856404',
  },
  note: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 5,
  },
});

export default CommentsBottomSheetTest; 