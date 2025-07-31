import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const ThemeTestModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { colors, isDarkMode, toggleTheme } = useTheme();

  // Only show in debug builds
  if (__DEV__ !== true) {
    return null;
  }

  return (
    <>
      {/* Test Button */}
      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: colors.primary }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.testButtonText}>🎨</Text>
      </TouchableOpacity>

      {/* Theme Test Modal */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              🎨 Theme Test
            </Text>
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Current Theme: {isDarkMode ? 'Dark' : 'Light'}
              </Text>
              
              <TouchableOpacity
                style={[styles.toggleButton, { backgroundColor: colors.primary }]}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
                </Text>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Color Values:
              </Text>
              
              <View style={styles.colorItem}>
                <Text style={[styles.colorLabel, { color: colors.text }]}>
                  colors.text:
                </Text>
                <Text style={[styles.colorValue, { color: colors.text }]}>
                  {colors.text} (This text should be visible)
                </Text>
              </View>

              <View style={styles.colorItem}>
                <Text style={[styles.colorLabel, { color: colors.text }]}>
                  colors.textSecondary:
                </Text>
                <Text style={[styles.colorValue, { color: colors.textSecondary }]}>
                  {colors.textSecondary} (Secondary text)
                </Text>
              </View>

              <View style={styles.colorItem}>
                <Text style={[styles.colorLabel, { color: colors.text }]}>
                  colors.background:
                </Text>
                <Text style={[styles.colorValue, { color: colors.text }]}>
                  {colors.background}
                </Text>
              </View>

              <View style={styles.colorItem}>
                <Text style={[styles.colorLabel, { color: colors.text }]}>
                  colors.border:
                </Text>
                <Text style={[styles.colorValue, { color: colors.text }]}>
                  {colors.border}
                </Text>
              </View>

              <View style={styles.colorItem}>
                <Text style={[styles.colorLabel, { color: colors.text }]}>
                  colors.primary:
                </Text>
                <Text style={[styles.colorValue, { color: colors.text }]}>
                  {colors.primary}
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Text Samples:
              </Text>

              <Text style={[styles.sampleText, { color: colors.text }]}>
                Primary text - should be clearly visible in both themes
              </Text>

              <Text style={[styles.sampleText, { color: colors.textSecondary }]}>
                Secondary text - should be slightly dimmed but still readable
              </Text>

              <View style={[styles.colorBox, { backgroundColor: colors.text }]}>
                <Text style={[styles.colorBoxText, { color: colors.background }]}>
                  Text color as background
                </Text>
              </View>

              <View style={[styles.colorBox, { backgroundColor: colors.textSecondary }]}>
                <Text style={[styles.colorBoxText, { color: colors.background }]}>
                  Secondary text color as background
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.textSecondary }]}
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  testButton: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 9999,
  },
  testButtonText: {
    fontSize: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  toggleButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  colorItem: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  colorValue: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  sampleText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  colorBox: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  colorBoxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThemeTestModal;
