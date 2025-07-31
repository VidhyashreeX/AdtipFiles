import { Platform, Linking, Alert } from 'react-native';
import ApiService from './ApiService';
import appJson from '../../app.json';

interface VersionCheckResponse {
  status: boolean;
  message: string;
  data?: {
    latest_version: string;
    minimum_version?: string;
    force_update: boolean;
    update_message?: string;
    store_url?: string;
    update_url?: string;
    release_notes?: string;
  };
}

// Get version from app.json for now (can be enhanced with react-native-device-info later)
const getCurrentVersionFromDevice = async (): Promise<string> => {
  // For now, use app.json version. Can be enhanced with DeviceInfo.getVersion() later
  return appJson.version || '1.0.0';
};

const getCurrentBuildFromDevice = async (): Promise<string> => {
  // For now, use a default build number. Can be enhanced with DeviceInfo.getBuildNumber() later
  return '1';
};

class VersionCheckService {
  private static instance: VersionCheckService;
  private isChecking = false;
  private lastCheckTime = 0;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private forceUpdateRequired = false;
  private updateInfo: VersionCheckResponse['data'] | null = null;

  private constructor() {}

  public static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  /**
   * Get current app version from device
   */
  public async getCurrentVersion(): Promise<string> {
    try {
      const version = await getCurrentVersionFromDevice();
      console.log('📱 [VersionCheckService] Current app version:', version);
      return version;
    } catch (error) {
      console.error('❌ [VersionCheckService] Error getting current version:', error);
      return '1.0.0'; // Fallback version
    }
  }

  /**
   * Get current build number from device
   */
  public async getCurrentBuildNumber(): Promise<string> {
    try {
      const buildNumber = await getCurrentBuildFromDevice();
      console.log('🔢 [VersionCheckService] Current build number:', buildNumber);
      return buildNumber;
    } catch (error) {
      console.error('❌ [VersionCheckService] Error getting build number:', error);
      return '1'; // Fallback build number
    }
  }

  /**
   * Check if force update is currently required
   */
  public isForceUpdateRequired(): boolean {
    return this.forceUpdateRequired;
  }

  /**
   * Get stored update information
   */
  public getUpdateInfo(): VersionCheckResponse['data'] | null {
    return this.updateInfo;
  }

  /**
   * Check if app needs update
   */
  public async checkForUpdates(forceCheck = false): Promise<VersionCheckResponse | null> {
    if (this.isChecking) {
      console.log('⏳ [VersionCheckService] Update check already in progress');
      return null;
    }
    const now = Date.now();
    if (!forceCheck && now - this.lastCheckTime < this.CHECK_INTERVAL) {
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
        const {
          latest_version,
          force_update,
          update_message,
          store_url,
          update_url,
          release_notes
        } = response.data;
        console.log('🔍 [VersionCheckService] Version comparison:', {
          current: currentVersion,
          latest: latest_version,
          forceUpdate: force_update
        });

        const needsUpdate = this.compareVersions(currentVersion, latest_version) < 0;

        if (needsUpdate) {
          // Store update information
          this.updateInfo = {
            latest_version,
            force_update,
            update_message,
            store_url: store_url || update_url || this.getDefaultStoreUrl(),
            release_notes
          };

          // Set force update flag
          this.forceUpdateRequired = force_update;

          console.log('⚠️ [VersionCheckService] Update required:', {
            needsUpdate,
            forceUpdate: force_update,
            updateMessage: update_message
          });

          return {
            status: true,
            message: update_message || (force_update ? 'A critical update is required to continue using the app.' : 'A new version is available'),
            data: this.updateInfo
          };
        } else {
          console.log('✅ [VersionCheckService] App is up to date');
          this.forceUpdateRequired = false;
          this.updateInfo = null;
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

  /**
   * Show update dialog (for non-force updates)
   */
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

  /**
   * Open app store for update
   */
  public async openStore(storeUrl?: string): Promise<void> {
    try {
      const url = storeUrl || this.getDefaultStoreUrl();
      console.log('🔗 [VersionCheckService] Opening store URL:', url);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('❌ [VersionCheckService] Cannot open store URL:', url);
        Alert.alert('Error', 'Cannot open app store. Please update manually.');
      }
    } catch (error) {
      console.error('❌ [VersionCheckService] Error opening store:', error);
      Alert.alert('Error', 'Failed to open app store. Please update manually.');
    }
  }

  /**
   * Force check for updates (ignores rate limiting)
   */
  public async forceCheckForUpdates(): Promise<VersionCheckResponse | null> {
    return this.checkForUpdates(true);
  }

  /**
   * Reset force update state (for testing purposes)
   */
  public resetForceUpdateState(): void {
    this.forceUpdateRequired = false;
    this.updateInfo = null;
    console.log('🔄 [VersionCheckService] Force update state reset');
  }
}

export default VersionCheckService; 