import React, { useState } from 'react'; 
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Search, Wallet, User } from 'lucide-react-native';
import { ContactItem } from '@/components/tipcall/ContactItem';
import { CategoryItem } from '@/components/home/CategoryItem';
import { useRouter } from 'expo-router';

const DUMMY_CONTACTS = [
  {
    id: '1',
    name: 'John Doe',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    status: 'online',
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
    status: 'online',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    status: 'online',
  },
  {
    id: '4',
    name: 'Emma Davis',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
    status: 'online',
  },
  {
    id: '5',
    name: 'David Smith',
    image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    status: 'offline',
  },
];

const CATEGORIES = [
  { id: '1', name: 'All' },
  { id: '2', name: 'Business' },
  { id: '3', name: 'Technology' },
  { id: '4', name: 'Health' },
  { id: '5', name: 'Education' },
  { id: '6', name: 'Entertainment' },
];

const LANGUAGES = [
  { id: '1', name: 'All' },
  { id: '2', name: 'English' },
  { id: '3', name: 'Hindi' },
  { id: '4', name: 'Assamese' },
  { id: '5', name: 'Bengali' },
  { id: '6', name: 'Bodo' },
  { id: '7', name: 'Dogri' },
  { id: '8', name: 'Gujarati' },
  { id: '9', name: 'Kannada' },
  { id: '10', name: 'Kashmiri' },
  { id: '11', name: 'Konkani' },
  { id: '12', name: 'Maithili' },
  { id: '13', name: 'Malayalam' },
  { id: '14', name: 'Manipuri' },
  { id: '15', name: 'Marathi' },
  { id: '16', name: 'Nepali' },
  { id: '17', name: 'Odia' },
  { id: '18', name: 'Punjabi' },
  { id: '19', name: 'Sanskrit' },
  { id: '20', name: 'Sindhi' },
  { id: '21', name: 'Tamil' },
  { id: '22', name: 'Telugu' },
  { id: '23', name: 'Urdu' },
];


const TABS = [
  { id: '1', name: 'All' },
  { id: '2', name: 'Recent' },
  { id: '3', name: 'Missed Calls' },
];

export default function TipCallScreen() {
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [selectedLanguage, setSelectedLanguage] = useState('1');
  const [selectedTab, setSelectedTab] = useState('1');
  const [dnd, setDnd] = useState(false); // DND toggle state
  const [modalVisible, setModalVisible] = useState(false); // Modal state
  const router = useRouter(); // Add router

  const handleToggle = () => {
    if (!dnd) {
      setDnd(true);
      setModalVisible(true);
    } else {
      setDnd(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* DND Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Do Not Disturb</Text>
            <Text style={styles.modalText}>Do Not Disturb mode is ON.</Text>
            <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <User size={18} color="white" />
          </View>
          <Text style={styles.title}>Tip Call</Text>
          <TouchableOpacity style={[styles.toggle, dnd && styles.toggleActive]} onPress={handleToggle} accessibilityRole="switch" accessibilityState={{ checked: dnd }}>
            <View style={[styles.toggleButton, dnd && styles.toggleButtonActive]} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.walletChip}>
            <Wallet size={16} color="#24d05a" />
            <Text style={styles.walletAmount}>₹ 1.96</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
            <User size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Language Horizontal Scroll */}
      <View style={styles.searchLangContainer}>
        <View style={styles.searchBarSmall}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Languages */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Languages</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.categoryBtn,
                selectedLanguage === language.id && styles.categoryBtnActive,
                {marginVertical: 0}
              ]}
              onPress={() => setSelectedLanguage(language.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedLanguage === language.id && styles.categoryTextActive,
                ]}
              >
                {language.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Categories */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {CATEGORIES.map((category) => (
            <CategoryItem
              key={category.id}
              name={category.name}
              selected={category.id === selectedCategory}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.selectedTab]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text
              style={[styles.tabText, selectedTab === tab.id && styles.selectedTabText]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact List */}
      <ScrollView style={styles.contactsContainer}>
        {DUMMY_CONTACTS.map((contact) => (
          <ContactItem
            key={contact.id}
            name={contact.name}
            image={contact.image}
            status={contact.status as any}
            onVoiceCall={() => {}}
            onVideoCall={() => {}}
          />
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#24d05a',
    marginRight: 12,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#24d05a',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 8,
  },
  toggleActive: {
    backgroundColor: '#ef4444', // red when active
    alignItems: 'flex-end',
  },
  toggleButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    // transition for smooth movement
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 12,
  },
  walletAmount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#24d05a',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchLangContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBarSmall: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  filtersContainer: {
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtnActive: {
    backgroundColor: '#24d05a',
  },
  categoryText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#24d05a',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedTabText: {
    color: '#24d05a',
    fontWeight: '600',
  },

  contactsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  bottomPadding: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 220,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#ef4444',
  },
  modalText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});