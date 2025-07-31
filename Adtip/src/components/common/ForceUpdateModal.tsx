import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import VersionCheckService from '../../services/VersionCheckService';

interface ForceUpdateModalProps {
  visible: boolean;
  updateInfo: {
    latest_version: string;
    force_update: boolean;
    update_message?: string;
    store_url?: string;
    update_url?: string;
    release_notes?: string;
  } | null;
}

const { width, height } = Dimensions.get('window');

const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  visible,
  updateInfo,
}) => {
  const { colors, isDarkMode } = useTheme();

  // Debug logging for theme colors
  React.useEffect(() => {
    if (visible && __DEV__) {
      console.log('🎨 [ForceUpdateModal] Theme colors:', {
        isDarkMode,
        text: colors.text,
        textSecondary: colors.textSecondary,
        background: colors.background,
        border: colors.border
      });
    }
  }, [visible, isDarkMode, colors]);

  const handleUpdatePress = async () => {
    if (updateInfo?.store_url || updateInfo?.update_url) {
      await VersionCheckService.getInstance().openStore(
        updateInfo.store_url || updateInfo.update_url
      );
    } else {
      await VersionCheckService.getInstance().openStore();
    }
  };

  if (!visible || !updateInfo) {
    return null;
  }

  const isForceUpdate = updateInfo.force_update;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <StatusBar
        backgroundColor="rgba(0,0,0,0.8)"
        barStyle="light-content"
        translucent={true}
      />
      
      {/* Full screen overlay */}
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            shadowColor: isDarkMode ? '#FFFFFF' : '#000000',
          }
        ]}>
          
          {/* Header with gradient */}
          <LinearGradient
            colors={isForceUpdate 
              ? ['#FF6B6B', '#FF8E53'] 
              : ['#4ECDC4', '#44A08D']
            }
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🚀</Text>
            </View>
            <Text style={styles.headerTitle}>
              {isForceUpdate ? 'Update Required' : 'Update Available'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Version {updateInfo.latest_version}
            </Text>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.message, { color: colors.text.primary }]}>
              {updateInfo.update_message ||
                (isForceUpdate
                  ? 'A critical update is required to continue using Adtip. Please update now to access all features.'
                  : 'A new version of Adtip is available with exciting new features and improvements!'
                )
              }
            </Text>

            {updateInfo.release_notes && (
              <View style={styles.releaseNotesContainer}>
                <Text style={[styles.releaseNotesTitle, { color: colors.text.primary }]}>
                  What&apos;s New:
                </Text>
                <Text style={[styles.releaseNotes, { color: colors.text.secondary }]}>
                  {updateInfo.release_notes}
                </Text>
              </View>
            )}

            {/* Features list */}
            <View style={styles.featuresContainer}>
              <Text style={[styles.featuresTitle, { color: colors.text.primary }]}>
                Why Update?
              </Text>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✨</Text>
                <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                  Latest features and improvements
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                  Enhanced security and performance
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🐛</Text>
                <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                  Bug fixes and stability improvements
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.updateButton, {
                backgroundColor: isForceUpdate ? '#FF6B6B' : '#4ECDC4'
              }]}
              onPress={handleUpdatePress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isForceUpdate 
                  ? ['#FF6B6B', '#FF8E53'] 
                  : ['#4ECDC4', '#44A08D']
                }
                style={styles.updateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.updateButtonText}>
                  Update Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!isForceUpdate && (
              <TouchableOpacity
                style={[styles.laterButton, { borderColor: colors.border }]}
                onPress={() => {
                  // For non-force updates, we could add a "later" option
                  // But since this is a force update modal, we'll keep it simple
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.laterButtonText, { color: colors.text.secondary }]}>
                  Remind Me Later
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: height * 0.4,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  releaseNotesContainer: {
    marginBottom: 20,
  },
  releaseNotesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  releaseNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 10,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  updateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  updateButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ForceUpdateModal;
