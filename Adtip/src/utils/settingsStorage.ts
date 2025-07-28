import OptimizedAsyncStorage from '../services/OptimizedAsyncStorage';
import { Logger } from './ProductionLogger';

const SETTINGS_KEYS = {
  AUTO_ROTATION: 'autoRotation',
  AUTO_PLAY: 'autoPlay',
  CELLULAR_DATA: 'cellularData',
  PUSH_NOTIFICATIONS: 'pushNotifications',
  EMAIL_NOTIFICATIONS: 'emailNotifications',
  ANALYTICS: 'analytics',
} as const;

export type SettingKey = keyof typeof SETTINGS_KEYS;

/**
 * Get a setting value from OptimizedAsyncStorage
 */
export const getSetting = async (key: SettingKey, defaultValue: boolean = true): Promise<boolean> => {
  try {
    const value = await OptimizedAsyncStorage.getItem(SETTINGS_KEYS[key]);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (error) {
    Logger.error('SettingsStorage', `Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Set a setting value in OptimizedAsyncStorage
 */
export const setSetting = async (key: SettingKey, value: boolean): Promise<void> => {
  try {
    await OptimizedAsyncStorage.setItem(SETTINGS_KEYS[key], JSON.stringify(value));
    Logger.debug('SettingsStorage', `Setting ${key} saved:`, value);
  } catch (error) {
    Logger.error('SettingsStorage', `Error setting ${key}:`, error);
  }
};

/**
 * Get multiple settings at once using optimized batch operations
 */
export const getSettings = async (keys: SettingKey[]): Promise<Record<SettingKey, boolean>> => {
  try {
    const storageKeys = keys.map(key => SETTINGS_KEYS[key]);
    const values = await OptimizedAsyncStorage.multiGet(storageKeys);

    const settings: Record<string, boolean> = {};
    values.forEach(([storageKey, value], index) => {
      const key = keys[index];
      settings[key] = value !== null ? JSON.parse(value) : true;
    });

    return settings as Record<SettingKey, boolean>;
  } catch (error) {
    Logger.error('SettingsStorage', 'Error getting multiple settings:', error);
    // Return default values
    const defaults: Record<string, boolean> = {};
    keys.forEach(key => {
      defaults[key] = true;
    });
    return defaults as Record<SettingKey, boolean>;
  }
};

/**
 * Set multiple settings at once
 */
export const setSettings = async (settings: Partial<Record<SettingKey, boolean>>): Promise<void> => {
  try {
    const keyValuePairs = Object.entries(settings).map(([key, value]) => [
      SETTINGS_KEYS[key as SettingKey],
      JSON.stringify(value)
    ]);
    
    await AsyncStorage.multiSet(keyValuePairs);
    console.log('[SettingsStorage] Multiple settings saved:', settings);
  } catch (error) {
    console.error('[SettingsStorage] Error setting multiple settings:', error);
  }
};

/**
 * Clear all settings
 */
export const clearSettings = async (): Promise<void> => {
  try {
    const keys = Object.values(SETTINGS_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('[SettingsStorage] All settings cleared');
  } catch (error) {
    console.error('[SettingsStorage] Error clearing settings:', error);
  }
};
