import { Platform, Linking, Alert } from 'react-native';
import ApiService from './ApiService';
import appJson from '../../app.json';

interface VersionCheckResponse {
  status: boolean;
  message: string;
  data?: {
    latest_version: string;
    minimum_version: string;
    force_update: boolean;
    update_message?: string;
    store_url?: string;
  };
}

// You may want to automate this for iOS/Android, but for now, keep it in sync with build.gradle
const CURRENT_VERSION = appJson.version || '1.0.0';
const CURRENT_BUILD = '1'; // Update this if you increment versionCode in build.gradle

class VersionCheckService {
  private static instance: VersionCheckService;
  private isChecking = false;
  private lastCheckTime = 0;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  /**
   * Get current app version
   */
  public async getCurrentVersion(): Promise<string> {
    try {
      console.log('📱 [VersionCheckService] Current app version:', CURRENT_VERSION);
      return CURRENT_VERSION;
    } catch (error) {
      console.error('❌ [VersionCheckService] Error getting current version:', error);
      return '1.0.0'; // Fallback version
    }
  }

  /**
   * Get current build number
   */
  public async getCurrentBuildNumber(): Promise<string> {
    try {
      console.log('🔢 [VersionCheckService] Current build number:', CURRENT_BUILD);
      return CURRENT_BUILD;
    } catch (error) {
      console.error('❌ [VersionCheckService] Error getting build number:', error);
      return '1'; // Fallback build number
    }
  }

  /**
   * Check if app needs update
   */
  public async checkForUpdates(): Promise<VersionCheckResponse | null> {
    if (this.isChecking) {
      console.log('⏳ [VersionCheckService] Update check already in progress');
      return null;
    }
    const now = Date.now();
    if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
      console.log('⏰ [VersionCheckService] Skipping check - too soon since last check');
      return null;
    }
    try {
      this.isChecking = true;
      this.lastCheckTime = now;
      console.log('🚀 [VersionCheckService] Starting version check...');
      const currentVersion = await this.getCurrentVersion();
      const currentBuild = await this.getCurrentBuildNumber();
      const platform = Platform.OS;
      console.log('📊 [VersionCheckService] Version check params:', {
        currentVersion,
        currentBuild,
        platform
      });
      const response = await ApiService.checkAppVersion({
        current_version: currentVersion,
        current_build: currentBuild,
        platform: platform
      });
      console.log('📥 [VersionCheckService] API Response:', response);
      if (response.status && response.data) {
        const { latest_version, minimum_version, force_update, update_message, store_url } = response.data;
        console.log('🔍 [VersionCheckService] Version comparison:', {
          current: currentVersion,
          latest: latest_version,
          minimum: minimum_version,
          forceUpdate: force_update
        });
        const needsUpdate = this.compareVersions(currentVersion, latest_version) < 0;
        const forceUpdate = force_update && this.compareVersions(currentVersion, minimum_version) < 0;
        if (needsUpdate || forceUpdate) {
          console.log('⚠️ [VersionCheckService] Update required:', {
            needsUpdate,
            forceUpdate,
            updateMessage: update_message
          });
          return {
            status: true,
            message: update_message || 'A new version is available',
            data: {
              latest_version,
              minimum_version,
              force_update: forceUpdate,
              update_message,
              store_url: store_url || this.getDefaultStoreUrl()
            }
          };
        } else {
          console.log('✅ [VersionCheckService] App is up to date');
        }
      }
      return null;
    } catch (error: any) {
      console.error('❌ [VersionCheckService] Error checking for updates:', {
        error: error.message,
        stack: error.stack
      });
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    return 0;
  }

  private getDefaultStoreUrl(): string {
    if (Platform.OS === 'ios') {
      return 'https://apps.apple.com/app/adtip-watch-to-earn/id1234567890';
    } else {
      return 'https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app';
    }
  }

  public showUpdateDialog(updateInfo: VersionCheckResponse['data']): void {
    if (!updateInfo) return;
    const { force_update, update_message, store_url } = updateInfo;
    const title = force_update ? 'Update Required' : 'Update Available';
    const message = update_message || 'A new version of Adtip is available. Please update to continue using the app.';
    const buttons: any[] = [
      {
        text: 'Update Now',
        onPress: () => this.openStore(store_url || this.getDefaultStoreUrl())
      }
    ];
    if (!force_update) {
      buttons.unshift({
        text: 'Later',
        style: 'cancel'
      });
    }
    Alert.alert(title, message, buttons, { cancelable: !force_update });
  }

  private async openStore(storeUrl: string): Promise<void> {
    try {
      console.log('🔗 [VersionCheckService] Opening store URL:', storeUrl);
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        console.error('❌ [VersionCheckService] Cannot open store URL:', storeUrl);
        Alert.alert('Error', 'Cannot open app store. Please update manually.');
      }
    } catch (error) {
      console.error('❌ [VersionCheckService] Error opening store:', error);
      Alert.alert('Error', 'Failed to open app store. Please update manually.');
    }
  }

  public async forceCheckForUpdates(): Promise<VersionCheckResponse | null> {
    this.lastCheckTime = 0; // Reset last check time
    return this.checkForUpdates();
  }
}

export default VersionCheckService; 