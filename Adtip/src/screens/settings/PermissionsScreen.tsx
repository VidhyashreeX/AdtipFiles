import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';
import PermissionManagerService from '../../services/PermissionManagerService';

const PERMISSIONS = [
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'bell',
  },
  {
    key: 'camera',
    label: 'Camera',
    icon: 'camera',
  },
  {
    key: 'microphone',
    label: 'Microphone',
    icon: 'mic',
  },
];

const PermissionsScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState({
    notifications: false,
    camera: false,
    microphone: false,
  });
  const [requesting, setRequesting] = useState({
    notifications: false,
    camera: false,
    microphone: false,
  });

  // Check all permissions
  const checkPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const permissionManager = PermissionManagerService.getInstance();
      const permissions = await permissionManager.checkAllPermissions();
      
      setPermissionStatus({
        notifications: permissions.notifications,
        camera: permissions.camera,
        microphone: permissions.microphone,
      });
    } catch (e) {
      console.error('Error checking permissions:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Request permission handlers
  const requestPermission = async (key: string) => {
    setRequesting((prev) => ({ ...prev, [key]: true }));
    try {
      const permissionManager = PermissionManagerService.getInstance();
      
      if (key === 'notifications') {
        const result = await permissionManager.requestNotificationPermissions();
        console.log('Notification permission result:', result);
      } else if (key === 'camera') {
        const result = await permissionManager.requestCallPermissions(true); // Include camera
        console.log('Camera permission result:', result);
      } else if (key === 'microphone') {
        const result = await permissionManager.requestCallPermissions(false); // Microphone only
        console.log('Microphone permission result:', result);
      }
      
      // Refresh permission status
      await checkPermissions();
    } catch (e) {
      console.error('Permission request error:', e);
      Alert.alert('Permission Error', 'Failed to request permission. Please try again.');
    }
    setRequesting((prev) => ({ ...prev, [key]: false }));
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <ScreenTransition animationType="fade">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <Header
          title="Permissions"
          showSearch={false}
          showWallet={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 16 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Checking permissions...</Text>
            </View>
          ) : (
            <View style={[styles.sectionContent, {
              backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
              borderRadius: 12,
              marginHorizontal: 16,
              shadowColor: isDarkMode ? '#000000' : '#000000',
              shadowOpacity: isDarkMode ? 0.3 : 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3
            }]}> 
              {PERMISSIONS.map((perm, idx) => {
                const isLast = idx === PERMISSIONS.length - 1;
                const granted = permissionStatus[perm.key as keyof typeof permissionStatus];
                return (
                  <View
                    key={perm.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 18,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      borderBottomColor: isDarkMode ? colors.border : '#F1F5F9',
                      backgroundColor: 'transparent',
                    }}
                  >
                    {/* Icon */}
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: granted ? '#10B98115' : '#F59E0B15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Icon name={perm.icon} size={18} color={granted ? '#10B981' : '#F59E0B'} />
                    </View>
                    {/* Text */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text.primary }}>{perm.label}</Text>
                      <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 1, lineHeight: 18 }}>
                        {granted ? 'Granted' : 'Not granted'}
                      </Text>
                    </View>
                    {/* Action */}
                    <View style={{ marginLeft: 8 }}>
                      <TouchableOpacity
                        onPress={() => (granted ? openSettings() : requestPermission(perm.key))}
                        disabled={requesting[perm.key as keyof typeof requesting]}
                        style={{
                          backgroundColor: granted
                            ? (isDarkMode ? colors.card : '#E5E7EB')
                            : colors.primary,
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderWidth: granted ? 1 : 0,
                          borderColor: granted ? (isDarkMode ? colors.border : '#E5E7EB') : 'transparent',
                        }}
                      >
                        {requesting[perm.key as keyof typeof requesting] ? (
                          <ActivityIndicator color={granted ? colors.primary : '#FFF'} size="small" />
                        ) : (
                          <Text style={{
                            color: granted
                              ? (isDarkMode ? colors.text.primary : colors.primary)
                              : '#FFF',
                            fontWeight: '600',
                          }}>
                            {granted ? 'Open Settings' : 'Grant'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  sectionContent: {
    overflow: 'hidden',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default PermissionsScreen; 