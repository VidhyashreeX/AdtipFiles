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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Context
import {useTheme} from '../../contexts/ThemeContext';

interface CreateContentModalProps {
  visible: boolean;
  onClose: () => void;
}

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  visible,
  onClose,
}) => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = React.useState(visible);
  const slideAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, slideAnimation]);

  const handleCloseModal = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const handleCreatePost = () => {
    setModalVisible(false);
    navigation.navigate('CreatePost' as never);
  };

  const handleUploadVideo = () => {
    setModalVisible(false);
    navigation.navigate('TipTubeUpload' as never);
  };

  const handleCreateShort = () => {
    setModalVisible(false);
    navigation.navigate('TipShortsUpload' as never);
  };

  const handleStartStream = () => {
    setModalVisible(false);
    navigation.navigate('StartStream' as never);
  };
  // Calculate transforms for animation
  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!modalVisible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleCloseModal}
      animationType="none">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <View style={styles.centeredView}>
          <Animated.View
            style={[
              styles.modalView,
              {backgroundColor: colors.background},
              {transform: [{translateY}]},
            ]}>
            <View style={styles.header}>
              <Text style={[styles.title, {color: colors.text.primary}]}>
                Create Content
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
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
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    marginBottom: 20,
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
