import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import VersionCheckService from '../../services/VersionCheckService';
import ForceUpdateModal from '../common/ForceUpdateModal';

const { width } = Dimensions.get('window');

interface DebugScenario {
  name: string;
  description: string;
  mockData: {
    latest_version: string;
    force_update: boolean;
    update_message?: string;
    store_url?: string;
    release_notes?: string;
  };
}

const DEBUG_SCENARIOS: DebugScenario[] = [
  {
    name: 'Critical Security Update',
    description: 'Simulates a critical security update (mandatory)',
    mockData: {
      latest_version: '99.0.0',
      force_update: true,
      update_message: 'A critical security update is required to continue using Adtip.\n\nPlease reach out to support@adtip.in for any issues.',
      store_url: 'https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app',
      release_notes: '🚨 Critical Security Update\n\n🔒 Security Fixes:\n• Fixed critical vulnerability\n• Enhanced data protection\n• Improved authentication\n\n✨ New Features:\n• Better performance\n• UI improvements\n• Bug fixes'
    }
  },
  {
    name: 'Feature Update',
    description: 'Simulates a feature update (mandatory)',
    mockData: {
      latest_version: '98.0.0',
      force_update: true,
      update_message: 'A critical update is required to continue using Adtip. Please update now to access all features.\n\nPlease reach out to support@adtip.in for any issues.',
      store_url: 'https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app',
      release_notes: '✨ New Features Update\n\n🎉 What&apos;s New:\n• Dark mode improvements\n• New earning opportunities\n• Enhanced video player\n• Better notifications\n\n🐛 Bug Fixes:\n• Performance improvements\n• Stability enhancements'
    }
  },
  {
    name: 'Major Version Update',
    description: 'Simulates a major version update (mandatory)',
    mockData: {
      latest_version: '100.0.0',
      force_update: true,
      update_message: 'Welcome to Adtip 100.0! This major update includes revolutionary changes.\n\nPlease reach out to support@adtip.in for any issues.',
      store_url: 'https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app',
      release_notes: '🎉 Adtip 100.0 - Revolutionary Update!\n\n🚀 Major Features:\n• Complete UI redesign\n• AI-powered recommendations\n• Advanced earning system\n• Social features\n• Live streaming\n\n💰 Earning Improvements:\n• Higher ad rewards\n• New earning methods\n• Faster withdrawals\n\n🔧 Technical:\n• 50% faster performance\n• Reduced battery usage\n• Better stability'
    }
  }
];

const ForceUpdateDebugButton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showForceUpdateModal, setShowForceUpdateModal] = useState(false);
  const [currentMockData, setCurrentMockData] = useState<DebugScenario['mockData'] | null>(null);

  // Only show in debug builds
  if (__DEV__ !== true) {
    return null;
  }

  const handleScenarioPress = (scenario: DebugScenario) => {
    setCurrentMockData(scenario.mockData);
    setShowDebugModal(false);
    setShowForceUpdateModal(true);
  };

  const handleResetVersionService = () => {
    VersionCheckService.getInstance().resetForceUpdateState();
    Alert.alert(
      'Debug Reset',
      'Version check service has been reset. Force update state cleared.',
      [{ text: 'OK' }]
    );
  };

  const handleTestRealAPI = async () => {
    try {
      const versionService = VersionCheckService.getInstance();

      // Get current version for debugging
      const currentVersion = await versionService.getCurrentVersion();
      const currentBuild = await versionService.getCurrentBuildNumber();

      console.log('🔧 [Debug] Testing real API with:', {
        currentVersion,
        currentBuild,
        platform: 'android'
      });

      const result = await versionService.forceCheckForUpdates();

      console.log('🔧 [Debug] API Result:', result);

      if (result && result.status && result.data) {
        Alert.alert(
          'Real API Test - Update Detected',
          `✅ Update Available!\n\nCurrent: ${currentVersion}\nLatest: ${result.data.latest_version}\nForce: ${result.data.force_update}\nBuild: ${currentBuild}\n\nMessage: ${result.message}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Show Modal',
              onPress: () => {
                setCurrentMockData(result.data);
                setShowForceUpdateModal(true);
              }
            }
          ]
        );
      } else {
        // Show detailed debug info even when no update
        Alert.alert(
          'Real API Test - No Update',
          `ℹ️ Debug Info:\n\nCurrent Version: ${currentVersion}\nCurrent Build: ${currentBuild}\nPlatform: android\n\nAPI Response:\nStatus: ${result?.status || 'false'}\nData: ${result?.data ? 'present' : 'null'}\nMessage: ${result?.message || 'none'}\n\n${result ? 'API responded but no update needed' : 'API returned null/undefined'}`,
          [
            { text: 'OK' },
            {
              text: 'Check Console',
              onPress: () => {
                console.log('🔧 [Debug] Full API Response:', result);
                console.log('🔧 [Debug] Version Service State:', {
                  forceUpdateRequired: versionService.isForceUpdateRequired(),
                  updateInfo: versionService.getUpdateInfo()
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('🔧 [Debug] API Test Error:', error);
      Alert.alert(
        'Real API Test Error',
        `❌ Failed to check for updates:\n\n${error}\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      {/* Debug Button - Floating in bottom right corner */}
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowDebugModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.debugButtonText}>🔧</Text>
      </TouchableOpacity>

      {/* Debug Scenarios Modal */}
      <Modal
        visible={showDebugModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDebugModal(false)}
      >
        <View style={styles.debugModalOverlay}>
          <View style={[styles.debugModalContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.debugModalTitle, { color: colors.text }]}>
              🔧 Force Update Debug
            </Text>
            
            <ScrollView style={styles.scenariosList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Test Scenarios:
              </Text>
              
              {DEBUG_SCENARIOS.map((scenario, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.scenarioButton, { borderColor: colors.border }]}
                  onPress={() => handleScenarioPress(scenario)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.scenarioName, { color: colors.text }]}>
                    {scenario.name}
                  </Text>
                  <Text style={[styles.scenarioDescription, { color: colors.textSecondary }]}>
                    {scenario.description}
                  </Text>
                  <Text style={[styles.scenarioDetails, { color: colors.textSecondary }]}>
                    Version: {scenario.mockData.latest_version} | Mandatory Update
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                Utilities:
              </Text>

              <TouchableOpacity
                style={[styles.utilityButton, { backgroundColor: colors.primary }]}
                onPress={handleTestRealAPI}
                activeOpacity={0.7}
              >
                <Text style={styles.utilityButtonText}>
                  🌐 Test Real API
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.utilityButton, { backgroundColor: '#FF6B6B' }]}
                onPress={handleResetVersionService}
                activeOpacity={0.7}
              >
                <Text style={styles.utilityButtonText}>
                  🔄 Reset Version Service
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.utilityButton, { backgroundColor: '#9B59B6' }]}
                onPress={async () => {
                  const versionService = VersionCheckService.getInstance();
                  const currentVersion = await versionService.getCurrentVersion();
                  const currentBuild = await versionService.getCurrentBuildNumber();

                  Alert.alert(
                    'Version Info',
                    `Current Version: ${currentVersion}\nCurrent Build: ${currentBuild}\nPlatform: android\n\nVersion Comparison Tests:\n• ${currentVersion} vs 33.0.0 = ${currentVersion === '33.0.0' ? 'Equal' : currentVersion < '33.0.0' ? 'Older' : 'Newer'}\n• ${currentVersion} vs 1.0.0 = ${currentVersion === '1.0.0' ? 'Equal' : currentVersion < '1.0.0' ? 'Older' : 'Newer'}`,
                    [{ text: 'OK' }]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.utilityButtonText}>
                  📊 Version Info
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.textSecondary }]}
              onPress={() => setShowDebugModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Force Update Modal for Testing */}
      <ForceUpdateModal
        visible={showForceUpdateModal}
        updateInfo={currentMockData}
      />

      {/* Debug overlay to close force update modal in debug mode */}
      {showForceUpdateModal && (
        <TouchableOpacity
          style={styles.debugCloseOverlay}
          onPress={() => {
            setShowForceUpdateModal(false);
            setCurrentMockData(null);
          }}
        >
          <Text style={styles.debugCloseText}>
            🔧 DEBUG: Tap to close
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 100,
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
  debugButtonText: {
    fontSize: 20,
  },
  debugModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  debugModalContainer: {
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
  debugModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scenariosList: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  scenarioButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  scenarioDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  scenarioDetails: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  utilityButton: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  utilityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  debugCloseOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 10000,
  },
  debugCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForceUpdateDebugButton;
