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
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Context
import {useTheme} from '../../contexts/ThemeContext';

interface CreateContentModalProps {
  visible: boolean;
  onClose: () => void;
}

const screenHeight = Dimensions.get('window').height;

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  visible: propVisible,
  onClose,
}) => {
  const {colors, isDarkMode} = useTheme();
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
    outputRange: [screenHeight, 0],
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
          backgroundColor={propVisible ? (isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)") : "transparent"}
          barStyle={propVisible ? "light-content" : (isDarkMode ? "light-content" : "dark-content")}
        />
        <TouchableOpacity
            style={[StyleSheet.absoluteFill, {backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'}]}
            activeOpacity={1}
            onPress={handleCloseModalWithAnimation}
        />
        <View style={styles.centeredView} pointerEvents="box-none">
          {isContentMounted && (
            <Animated.View
              style={[
                styles.modalView,
                {
                  backgroundColor: colors.background,
                  shadowColor: isDarkMode ? colors.white : colors.black,
                },
                {transform: [{translateY}]},
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, {color: colors.text.primary}]}>
                  Create Content
                </Text>
                <TouchableOpacity 
                  onPress={handleCloseModalWithAnimation}
                  style={[styles.closeButton, {backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100]}]}
                >
                  <Icon name="x" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleCreatePost}
                >
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
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleUploadVideo}
                >
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
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleCreateShort}
                >
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
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleStartStream}
                >
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
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 200,
    width: '100%',
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
