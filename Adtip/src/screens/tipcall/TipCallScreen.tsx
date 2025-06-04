import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Alert, // For toasts
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Using Feather as per existing imports
import {useNavigation, useFocusEffect} from '@react-navigation/native';

// Components
import Header from '../../components/common/Header';
import ApiService from '../../services/ApiService'; // Assuming ApiService is set up

// Context
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';

// Constants (assuming API_ENDPOINTS.USERS.FILTER_EXPERTS or similar exists, or we use /users directly)
// For now, let's assume the endpoint is just '/users' for POST as per web
const EXPERTS_ENDPOINT = '/users'; // Or replace with API_ENDPOINTS.USERS.FILTER_EXPERTS if available

// Types
interface TipCallScreenProps {
  walletBalance?: string;
}

interface Expert {
  id: number;
  name: string;
  specialty: string; // Derived from interests
  description: string;
  price: number; // Assuming a fixed price or from API
  rating: number;
  ratingCount: number;
  avatar: string | null; // Profile image
  is_available: boolean;
  online_status: boolean;
}

// Web version categories and mapping
const categories = [
  "Health", "Finance", "Tech", "Business", "Education",
  "Lifestyle", "Career", "Arts", "Legal", "Sports"
];

const categoryToInterestMap: {[key: string]: number} = {
  Health: 1,
  Finance: 2,
  Tech: 3,
  Business: 4,
  Education: 5,
  Lifestyle: 6,
  Career: 7,
  Arts: 8,
  Legal: 9,
  Sports: 10,
};

const MAX_FETCH_RETRIES = 3;
const ITEMS_PER_PAGE = 10; // Or as per your API limit

const TipCallScreen: React.FC<TipCallScreenProps> = ({walletBalance}) => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user, isAuthenticated} = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchRetryCount, setFetchRetryCount] = useState(0);
  
  const [expertData, setExpertData] = useState<Expert[]>([]);
  // const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]); // expertData will be the filtered list

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Store category name
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  // const [callType, setCallType] = useState<"voice" | "video" | null>(null); // Assuming voice call for now

  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  // Helper to get full image URL (adapted from your existing code)
  const getFullImageUrl = (url?: string | null): string | null => {
    if (!url || url === 'null' || url === 'undefined' || url.includes('placeholder.svg')) {
      // Return a local placeholder or null if you have one, or a remote placeholder
      return 'https://via.placeholder.com/100'; // Placeholder
    }
    if (url.startsWith('http')) {
      return url;
    }
    // Assuming API_BASE_URL is accessible or configured in ApiService
    // This might need adjustment based on how ApiService constructs URLs or if you have a global const
    const BASE_URL_FOR_IMAGES = ApiService.defaults.baseURL?.replace('/api', '') || ''; // Example
    return `${BASE_URL_FOR_IMAGES}${url.startsWith('/') ? '' : '/'}${url}`;
  };


  const fetchExperts = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      // @ts-ignore
      navigation.navigate("Login"); // Adjust screen name if different
      return;
    }

    if (fetchRetryCount >= MAX_FETCH_RETRIES && !isRefresh) {
      setLoading(false);
      setError("Failed to load experts after multiple attempts. Please try again later.");
      return;
    }

    setLoading(true);
    if(!isRefresh) setError(null);


    try {
      const interestIds = selectedCategory ? [categoryToInterestMap[selectedCategory]] : undefined; // API might expect undefined or empty array
      const userIdString = user?.id ? String(user.id) : null;

      const requestBody = {
        // id: 0, // This was in web, might not be needed or different for your API
        page,
        limit: ITEMS_PER_PAGE,
        // language: [4], // From web, adjust if needed
        ...(interestIds && { interest: interestIds }), // Send interest only if a category is selected
        ...(userIdString && { user_id: userIdString, loggined_user_id: userIdString }), // Send user_id if available
        ...(searchQuery && { search_by_name: searchQuery }),
        // sortBy: {} // From web, adjust if needed
      };
      
      // console.log("Fetching experts with body:", JSON.stringify(requestBody, null, 2));

      const response = await ApiService.post<any>(EXPERTS_ENDPOINT, requestBody);
      // console.log("API Response:", JSON.stringify(response, null, 2));


      if (!response || !response.status || !Array.isArray(response.data)) {
        setFetchRetryCount(prev => prev + 1);
        throw new Error(response?.message || "Invalid response format from API");
      }
      
      const mappedExperts: Expert[] = response.data.map((apiUser: any) => ({
        id: apiUser.id,
        name: apiUser.name || `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || "Anonymous User",
        specialty: apiUser.interests?.length > 0 ? apiUser.interests.map((i:any)=>i.name).join(', ') : (apiUser.expertises?.length > 0 ? apiUser.expertises.map((e:any)=>e.name).join(', ') : "General"),
        description: apiUser.bio || `Available for consultation. ${apiUser.online_status ? "Online now" : "Offline"}`,
        price: parseFloat(apiUser.calling_rate) || 100, // Use actual calling_rate or default
        rating: parseFloat(apiUser.rating?.toFixed(1)) || 4.5,
        ratingCount: parseInt(apiUser.rating_count) || 10,
        avatar: getFullImageUrl(apiUser.profile_image || apiUser.avatar),
        is_available: apiUser.is_available === true || apiUser.is_available === 1,
        online_status: apiUser.online_status === true || apiUser.online_status === 1,
      })).filter((exp: Expert) => exp.id !== user?.id); // Filter out self

      setExpertData(mappedExperts);
      setTotalPages(
        response.pagination?.limit && response.pagination?.totalRecords
          ? Math.ceil(response.pagination.totalRecords / response.pagination.limit)
          : Math.ceil(mappedExperts.length / ITEMS_PER_PAGE) || 1 // Fallback if pagination not in response
      );
      setFetchRetryCount(0); // Reset on success
      if(!isRefresh) setError(null);

    } catch (error: any) {
      console.error("Error fetching experts:", error);
      if (fetchRetryCount < MAX_FETCH_RETRIES && !isRefresh) {
        setFetchRetryCount(prev => prev + 1);
        // Optionally, retry automatically after a delay
      }
      const errorMessage = error?.response?.data?.message || error?.message || "An unexpected error occurred";
      if(!isRefresh) setError(errorMessage);
      Alert.alert("Error", fetchRetryCount + 1 >= MAX_FETCH_RETRIES && !isRefresh ? "Failed to load. Please try again later." : "Retrying...");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.id, page, searchQuery, selectedCategory, fetchRetryCount, navigation]);


  useEffect(() => {
    fetchExperts();
  }, [page]); // Fetch when page changes

  useEffect(() => {
    // Reset page to 1 and fetch when search or category changes
    setPage(1); 
    fetchExperts();
  }, [searchQuery, selectedCategory]);


  useFocusEffect(
    useCallback(() => {
      // This will run when the screen comes into focus
      setFetchRetryCount(0); // Reset retries on focus
      fetchExperts();
    }, []) // Keep dependencies minimal for focus effect, primary fetch is manual or via other useEffects
  );


  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // Debounce could be added here
  };

  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null); // Deselect
    } else {
      setSelectedCategory(categoryName);
      Alert.alert("Category Selected", `Showing experts in ${categoryName}`);
    }
  };

  const handleCallRequest = (expert: Expert) => {
    if (!isAuthenticated) {
      // @ts-ignore
      navigation.navigate("Login"); // Adjust screen name
      return;
    }

    if (!expert.is_available || !expert.online_status) {
      Alert.alert("Unavailable", `${expert.name} is currently unavailable for calls.`);
      return;
    }
    setSelectedExpert(expert);
    setShowCallDialog(true);
  };

  const initiateCall = () => {
    if (!selectedExpert) return;

    const callPrice = selectedExpert.price;
    // Assuming user wallet balance is available via `user.wallet` or `walletBalance` prop
    const currentUserWallet = user?.wallet || parseFloat(walletBalance || "0");

    if (currentUserWallet < callPrice) {
      Alert.alert("Insufficient Balance", "Please add money to your wallet to continue.", [
        { text: "Cancel" },
        // @ts-ignore
        { text: "Go to Wallet", onPress: () => navigation.navigate("Wallet") } // Adjust screen name
      ]);
      setShowCallDialog(false);
      return;
    }

    Alert.alert("Connecting", `Connecting to ${selectedExpert.name}...`);
    // Simulate call connection and deduction
    setTimeout(() => {
      Alert.alert("Connected", `You're now connected with ${selectedExpert.name}. ₹${callPrice}/min will be charged.`);
      // Navigate to actual call screen or start call service
      // For now, just closing dialog
      // @ts-ignore
      navigation.navigate('CallScreen', { // Or your actual call screen
        userId: selectedExpert.id,
        userName: selectedExpert.name,
        userAvatar: selectedExpert.avatar,
        callRate: selectedExpert.price,
      });

    }, 2000);
    setShowCallDialog(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1); // Reset to first page on refresh
    setFetchRetryCount(0); // Reset retries
    fetchExperts(true); // Pass true for isRefresh
  };

  const renderExpertCard = ({item}: {item: Expert}) => (
    <TouchableOpacity 
        style={[styles.expertCard, {backgroundColor: colors.card}]}
        // @ts-ignore
        onPress={() => navigation.navigate('ExpertProfile', { expertId: item.id })} // Navigate to expert profile
    >
      <View style={styles.cardHeader}>
        {item.avatar ? (
          <Image source={{uri: item.avatar}} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, {backgroundColor: colors.border}]}>
            <Icon name="user" size={24} color={colors.text.secondary} />
          </View>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={[styles.expertName, {color: colors.text.primary}]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.expertSpecialty, {color: colors.text.secondary}]} numberOfLines={1}>{item.specialty}</Text>
        </View>
         <View style={[styles.statusIndicator, {backgroundColor: item.online_status ? colors.success : colors.gray[400]}]} />
      </View>
      <Text style={[styles.expertDescription, {color: colors.text.secondary}]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.cardRow}>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={[styles.ratingText, {color: colors.text.secondary}]}>
            {item.rating.toFixed(1)} ({item.ratingCount})
          </Text>
        </View>
        <Text style={[styles.expertPrice, {color: colors.primary}]}>
          ₹{item.price}/min
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.callButton,
          {backgroundColor: (item.is_available && item.online_status) ? colors.primary : colors.gray[300]},
        ]}
        onPress={() => handleCallRequest(item)}
        disabled={!item.is_available || !item.online_status}>
        <Icon name="phone" size={16} color={colors.white} />
        <Text style={styles.callButtonText}>
          {(item.is_available && item.online_status) ? 'Request Call' : 'Unavailable'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCategoryBadge = (categoryName: string) => (
    <TouchableOpacity
      key={categoryName}
      style={[
        styles.categoryBadge,
        {borderColor: colors.primary},
        selectedCategory === categoryName ? {backgroundColor: colors.primary} : {backgroundColor: colors.background},
      ]}
      onPress={() => handleCategorySelect(categoryName)}>
      <Text
        style={[
          styles.categoryBadgeText,
          selectedCategory === categoryName ? {color: colors.white} : {color: colors.primary},
        ]}>
        {categoryName}
      </Text>
    </TouchableOpacity>
  );

  if (loading && page === 1 && !refreshing && expertData.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{color: colors.text.secondary, marginTop: 10}}>Loading Experts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.backgroundMuted || colors.gray[50]}]}>
      <Header
        title="TipCall Experts"
        showBackButton={false} // Or true if needed
        showLogo={false}
        showWallet={true}
        walletAmount={walletBalance}
      />
      
      {/* Search Bar */}
      <View style={[styles.searchBarContainer, {backgroundColor: colors.card}]}>
        <Icon name="search" size={20} color={colors.text.disabled} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, {color: colors.text.primary, borderColor: colors.border}]}
          placeholder="Search for experts..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={() => { setPage(1); fetchExperts(); }}
        />
      </View>

      {/* Talk to Earn Banner */}
      <ScrollView 
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}
      >
        <View style={[styles.bannerContainer, {backgroundColor: colors.card}]}>
            <View style={styles.bannerTextContent}>
                <Text style={[styles.bannerTitle, {color: colors.text.primary}]}>Talk to Earn</Text>
                <Text style={[styles.bannerDescription, {color: colors.text.secondary}]}>
                Share your expertise through one-on-one calls and get paid.
                </Text>
                <TouchableOpacity 
                    style={[styles.bannerButton, {backgroundColor: colors.primary}]}
                    onPress={() => Alert.alert("Become an Expert", "Profile completion required to become a TipCall expert.")}
                >
                <Text style={styles.bannerButtonText}>Become an Expert</Text>
                </TouchableOpacity>
            </View>
            <Image 
                source={{uri: 'https://via.placeholder.com/150x100?text=AdTip+Banner'}} // Replace with your actual banner image
                style={styles.bannerImage}
                resizeMode="contain"
            />
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map(renderCategoryBadge)}
          </ScrollView>
        </View>

        {/* Experts List */}
        {error && !loading && expertData.length === 0 ? (
          <View style={styles.centerContent}>
            <Icon name="alert-circle" size={40} color={colors.error} />
            <Text style={[styles.errorText, {color: colors.error}]}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh} style={[styles.retryButton, {borderColor: colors.primary}]}>
                <Text style={{color: colors.primary}}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !loading && expertData.length === 0 && !error ? (
          <View style={styles.centerContent}>
            <Icon name="users" size={40} color={colors.text.disabled} />
            <Text style={[styles.emptyListText, {color: colors.text.secondary}]}>No experts found. Try a different search or category.</Text>
          </View>
        ) : (
          <FlatList
            data={expertData}
            renderItem={renderExpertCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContentContainer}
            // Removed RefreshControl from here, added to outer ScrollView
            // ListFooterComponent={loading && page > 1 ? <ActivityIndicator size="small" color={colors.primary} style={{marginVertical: 20}} /> : null}
            // onEndReached={handleLoadMore} // If using infinite scroll instead of pagination buttons
            // onEndReachedThreshold={0.5}
          />
        )}

        {/* Pagination Controls */}
        {expertData.length > 0 && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              style={[styles.paginationButton, {opacity: (page === 1 || loading) ? 0.5 : 1}]}>
              <Icon name="chevron-left" size={20} color={colors.primary} />
              <Text style={[styles.paginationButtonText, {color: colors.primary}]}>Prev</Text>
            </TouchableOpacity>
            <Text style={[styles.paginationText, {color: colors.text.secondary}]}>
              Page {page} of {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              style={[styles.paginationButton, {opacity: (page === totalPages || loading) ? 0.5 : 1}]}>
              <Text style={[styles.paginationButtonText, {color: colors.primary}]}>Next</Text>
              <Icon name="chevron-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Call Dialog Modal */}
      <Modal
        transparent={true}
        visible={showCallDialog}
        animationType="slide"
        onRequestClose={() => setShowCallDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <Text style={[styles.modalTitle, {color: colors.text.primary}]}>Request a Voice Call</Text>
            {selectedExpert && (
              <>
                <Text style={[styles.modalExpertName, {color: colors.text.primary}]}>{selectedExpert.name}</Text>
                <Text style={[styles.modalExpertSpecialty, {color: colors.text.secondary}]}>{selectedExpert.specialty}</Text>
                <Text style={[styles.modalExpertPrice, {color: colors.primary}]}>Rate: ₹{selectedExpert.price}/min</Text>
              </>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.gray[200]}]}
                onPress={() => setShowCallDialog(false)}>
                <Text style={[styles.modalButtonText, {color: colors.text.primary}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={initiateCall}>
                <Text style={[styles.modalButtonText, {color: colors.white}]}>Start Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    // borderColor will be set by theme colors.card
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 16,
  },
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerTextContent: {
    flex: 1,
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  bannerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  categoriesSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingVertical: 4,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10, // Add some padding if search/categories are sticky
  },
  expertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expertSpecialty: {
    fontSize: 13,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  expertDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    marginLeft: 5,
  },
  expertPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    // borderColor will be set by theme
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  paginationText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalExpertName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalExpertSpecialty: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalExpertPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 10,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  // Add other styles from the web version, translated
});

// Apply theme colors to styles that need it, e.g., borders
// This is a simplified approach. For full dynamic theming, styles might need to be created inside the component
// or by using a theming library.
const getThemedStyles = (colors: any) => StyleSheet.create({
    ...styles, // Spread existing static styles
    searchBarContainer: {
        ...styles.searchBarContainer,
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
    },
    searchInput: {
        ...styles.searchInput,
        color: colors.text.primary,
        borderColor: colors.border,
        backgroundColor: colors.inputBackground || colors.background, // Assuming inputBackground in theme
    },
    bannerContainer: {
        ...styles.bannerContainer,
        backgroundColor: colors.card,
    },
    expertCard: {
        ...styles.expertCard,
        backgroundColor: colors.card,
    },
    paginationContainer: {
        ...styles.paginationContainer,
        borderTopColor: colors.border,
    },
    modalContent: {
        ...styles.modalContent,
        backgroundColor: colors.card,
    },
    // ... any other styles that need dynamic theme colors
});


export default TipCallScreen;