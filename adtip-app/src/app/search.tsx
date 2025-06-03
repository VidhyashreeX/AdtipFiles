import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons'; // Make sure to install @expo/vector-icons
import Header from '@/components/Header';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header activeTab="search" />
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search YouTube"
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.micButton}>
          <Ionicons name="mic" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Search Screen</Text>
        <Text>Search functionality coming soon!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  micButton: {
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
