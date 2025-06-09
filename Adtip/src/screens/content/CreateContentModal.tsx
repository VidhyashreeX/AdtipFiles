// src/screens/content/CreateContentModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  Dimensions, // Added Dimensions
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Context
import {useTheme} from '../../contexts/ThemeContext';

interface CreateContentModalProps {
  visible: boolean;
  onClose: () => void;
}

const screenHeight = Dimensions.get('window').height; // Get screen height for animation

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  visible: propVisible, // Renamed for clarity within this component
  onClose,
}) => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [isContentMounted, setIsContentMounted] = React.useState(false);
  const slideAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (propVisible) {
      setIsContentMounted(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      if (isContentMounted) {
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsContentMounted(false);
        });
      }
    }
  }, [propVisible, slideAnimation, isContentMounted]);

  const handleCloseModalWithAnimation = () => {
    onClose();
  };

  const createNavigationHandler = (screenName: string) => () => {
    onClose();
    navigation.navigate(screenName as never);
  };

  const handleCreatePost = createNavigationHandler('CreatePost');
  const handleUploadVideo = createNavigationHandler('TipTubeUpload');
  const handleCreateShort = createNavigationHandler('TipShortsUpload');
  const handleStartStream = createNavigationHandler('StartStream');

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    // Corrected outputRange:
    // 0 (initial state, off-screen) -> screenHeight
    // 1 (final state, on-screen) -> 0
    outputRange: [screenHeight, 0], // Modal slides up from the bottom
  });

  if (!isContentMounted && !propVisible) {
      return null;
  }

  return (
    <Modal
      transparent={true}
      visible={propVisible}
      onRequestClose={handleCloseModalWithAnimation}
      animationType="none"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor={propVisible ? "rgba(0,0,0,0.5)" : "transparent"}
          barStyle={propVisible ? "light-content" : (colors.isDarkMode ? "light-content" : "dark-content")}
        />
        <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseModalWithAnimation}
        />
        <View style={styles.centeredView} pointerEvents="box-none">
          {isContentMounted && (
            <Animated.View
              style={[
                styles.modalView,
                {backgroundColor: colors.background},
                {transform: [{translateY}]}, // Apply the corrected translateY
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, {color: colors.text.primary}]}>
                  Create Content
                </Text>
                <TouchableOpacity onPress={handleCloseModalWithAnimation}>
                  <Icon name="x" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.option, {backgroundColor: colors.gray[100]}]}
                  onPress={handleCreatePost}>
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Icon name="file-text" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Create Post
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, {backgroundColor: colors.gray[100]}]}
                  onPress={handleUploadVideo}>
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.secondary},
                    ]}>
                    <Icon name="video" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Upload Video
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, {backgroundColor: colors.gray[100]}]}
                  onPress={handleCreateShort}>
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.error},
                    ]}>
                    <Icon name="play" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Create Short
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, {backgroundColor: colors.gray[100]}]}
                  onPress={handleStartStream}>
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.info},
                    ]}>
                    <Icon name="wifi" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Start Stream
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 200,
    width: '100%', // Ensure modal view takes full width
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  optionsContainer: {
    marginBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});

export default CreateContentModal;
