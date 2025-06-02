import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { Image, Video, X } from 'lucide-react-native';

// Define types for the options
type OptionType = 'create-post' | 'tip-tube' | 'tip-shorts';

export default function CreateContentScreen() {
  const { hasChannel } = useUserStore();
  const [modalVisible, setModalVisible] = useState<boolean>(true);
  const router = useRouter();

  useFocusEffect(() => {
    setModalVisible(true);
    return () => {};
  });

  const handleOptionPress = (option: OptionType): void => {
    setModalVisible(false);
    if (!hasChannel) {
      router.push('/channel/create');
      return;
    }

    switch (option) {
      case 'create-post':
        router.push('/CreatePost');
        break;
      case 'tip-tube':
        router.push('/tiptubeupload');
        break;
      case 'tip-shorts':
        router.push('tipshortsupload');
        break;
      default:
        break;
    }
  };

  const handleClose = (): void => {
    setModalVisible(false);
    router.back();
  };

  if (!modalVisible) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Modal is closed</Text>
        <TouchableOpacity
          style={styles.reopenButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.reopenButtonText}>Reopen Modal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.optionsContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('create-post')}
                activeOpacity={0.7}
              >
                <Image size={24} color="#24d05a" style={styles.icon} />
                <Text style={styles.optionText}>Create Post</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('tip-tube')}
                activeOpacity={0.7}
              >
                <Video size={24} color="#24d05a" style={styles.icon} />
                <Text style={styles.optionText}>Tip Tube</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('tip-shorts')}
                activeOpacity={0.7}
              >
                <Video size={24} color="#24d05a" style={styles.icon} />
                <Text style={styles.optionText}>Tip Shorts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fallbackText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 20,
  },
  reopenButton: {
    backgroundColor: '#24d05a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  reopenButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
});