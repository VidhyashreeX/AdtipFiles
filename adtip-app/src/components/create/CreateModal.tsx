import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Image, Video, Film, X} from 'lucide-react-native';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreatePost: () => void;
  onCreateVideo: () => void;
  onCreateShort: () => void;
}

export function CreateModal({
  visible,
  onClose,
  onCreatePost,
  onCreateVideo,
  onCreateShort,
}: CreateModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            <TouchableOpacity style={styles.option} onPress={onCreatePost}>
              <View style={styles.iconContainer}>
                <Image size={24} color="#24d05a" />
              </View>
              <Text style={styles.optionText}>Create Post</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={onCreateVideo}>
              <View style={styles.iconContainer}>
                <Video size={24} color="#24d05a" />
              </View>
              <Text style={styles.optionText}>TipTube Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={onCreateShort}>
              <View style={styles.iconContainer}>
                <Film size={24} color="#24d05a" />
              </View>
              <Text style={styles.optionText}>TipTube Short</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
});
