import {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';

export default function SelectCategoryScreen() {
  const {caption, selectedMedia} = useLocalSearchParams();
  const parsedMedia = selectedMedia
    ? typeof selectedMedia === 'string'
      ? JSON.parse(selectedMedia)
      : selectedMedia
    : null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Changed to single string or null

  const categories = [
    'art & design',
    'beauty transformations',
    'business & marketing',
    'comedy & memes',
    'creative edits',
    'daily routines',
    'dance',
    'digital art',
    'digital marketing',
    'educational & informative',
    'entertainment & creative content',
    'entrepreneurship',
    'exploring new places',
    'fashion & beauty',
    'fitness & sports',
    'food & cooking',
    'interesting discoveries',
    'learning new skills',
    'life advice',
    'lifestyle & personal content',
    'makeup tutorials',
    'motivation & self-improvement',
    'motivational speeches',
    'movie clips',
  ];

  const handleCategoryPress = (category: string) => {
    // If the category is already selected, deselect it; otherwise, select it
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleContinue = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category before continuing.');
      return;
    }
    router.push({
      pathname: '/PromotePage',
      params: {
        caption,
        selectedMedia: JSON.stringify(parsedMedia),
        category: selectedCategory, // Pass single category as a string
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Media Category</Text>
      </View>
      <Text style={styles.subTitle}>
        Tell us what piques your curiosity and passions for your post
      </Text>

      <ScrollView contentContainerStyle={styles.categoryList}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryPress(category)}>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    padding: 16,
    paddingTop: 48, // Move content down by 1 inch (96 pixels)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    fontSize: 24,
    color: '#000',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: '48%',
  },
  selectedCategoryButton: {
    borderColor: '#24d05a',
    backgroundColor: '#e6fff0',
  },
  categoryText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#24d05a',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#24d05a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32, // Already adjusted to move footer down
  },
  continueButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
