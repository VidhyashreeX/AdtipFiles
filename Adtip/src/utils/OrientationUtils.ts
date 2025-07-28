// src/utils/OrientationUtils.ts
import { Dimensions, StatusBar } from 'react-native';
import Orientation from 'react-native-orientation-locker';

export type OrientationType = 'portrait' | 'landscape' | 'portraitUpsideDown' | 'landscapeLeft' | 'landscapeRight';

// ✅ ORIENTATION DETECTION
export const OrientationDetector = {
  // Get current orientation
  getCurrentOrientation: (): Promise<OrientationType> => {
    return new Promise((resolve) => {
      Orientation.getOrientation((orientation) => {
        resolve(orientation as OrientationType);
      });
    });
  },
  
  // Check if device is in landscape
  isLandscape: (): boolean => {
    const { width, height } = Dimensions.get('window');
    return width > height;
  },
  
  // Check if device is in portrait
  isPortrait: (): boolean => {
    const { width, height } = Dimensions.get('window');
    return height > width;
  },
  
  // Get screen dimensions for current orientation
  getScreenDimensions: () => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    
    return {
      width,
      height,
      isLandscape,
      isPortrait: !isLandscape,
      aspectRatio: width / height,
    };
  },
};

// ✅ ORIENTATION MANAGEMENT
export const OrientationManager = {
  // Lock to portrait
  lockToPortrait: () => {
    Orientation.lockToPortrait();
  },
  
  // Lock to landscape
  lockToLandscape: () => {
    Orientation.lockToLandscape();
  },
  
  // Lock to landscape left
  lockToLandscapeLeft: () => {
    Orientation.lockToLandscapeLeft();
  },
  
  // Lock to landscape right
  lockToLandscapeRight: () => {
    Orientation.lockToLandscapeRight();
  },
  
  // Unlock all orientations
  unlockAllOrientations: () => {
    Orientation.unlockAllOrientations();
  },
  
  // Get device orientation
  getDeviceOrientation: (): Promise<OrientationType> => {
    return new Promise((resolve) => {
      Orientation.getDeviceOrientation((orientation) => {
        resolve(orientation as OrientationType);
      });
    });
  },
};

// ✅ SCREEN-SPECIFIC ORIENTATION CONFIGS
export const SCREEN_ORIENTATION_CONFIGS = {
  // Video/media screens - support all orientations
  MEDIA_SCREEN: {
    supportedOrientations: ['portrait', 'landscape'] as OrientationType[],
    defaultOrientation: 'portrait' as OrientationType,
    autoRotate: true,
    hideStatusBar: true,
  },
  
  // Main app screens - portrait only
  MAIN_SCREEN: {
    supportedOrientations: ['portrait'] as OrientationType[],
    defaultOrientation: 'portrait' as OrientationType,
    autoRotate: false,
    hideStatusBar: false,
  },
  
  // Camera screens - support all orientations
  CAMERA_SCREEN: {
    supportedOrientations: ['portrait', 'landscape'] as OrientationType[],
    defaultOrientation: 'portrait' as OrientationType,
    autoRotate: true,
    hideStatusBar: true,
  },
  
  // Game screens - landscape preferred
  GAME_SCREEN: {
    supportedOrientations: ['landscape'] as OrientationType[],
    defaultOrientation: 'landscape' as OrientationType,
    autoRotate: false,
    hideStatusBar: true,
  },
  
  // Modal screens - inherit from parent
  MODAL_SCREEN: {
    supportedOrientations: ['portrait'] as OrientationType[],
    defaultOrientation: 'portrait' as OrientationType,
    autoRotate: false,
    hideStatusBar: false,
  },
} as const;

// ✅ ORIENTATION-AWARE NAVIGATION OPTIONS
export const getOrientationAwareNavigationOptions = (screenType: keyof typeof SCREEN_ORIENTATION_CONFIGS) => {
  const config = SCREEN_ORIENTATION_CONFIGS[screenType];
  
  return {
    // Status bar configuration
    statusBarHidden: config.hideStatusBar,
    statusBarStyle: config.hideStatusBar ? 'light' : 'dark',
    
    // Orientation configuration
    orientation: config.defaultOrientation,
    supportedOrientations: config.supportedOrientations,
    
    // Animation adjustments for orientation
    animationDuration: config.autoRotate ? 300 : 250,
    
    // Gesture adjustments for orientation
    gestureEnabled: true,
    gestureDirection: config.supportedOrientations.includes('landscape') ? 'vertical' : 'horizontal',
  };
};

// ✅ ORIENTATION CHANGE HANDLER
export class OrientationChangeHandler {
  private listeners: ((orientation: OrientationType) => void)[] = [];
  private currentOrientation: OrientationType = 'portrait';
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // Listen for orientation changes
    Orientation.addOrientationListener(this.handleOrientationChange);
    
    // Get initial orientation
    this.getCurrentOrientation();
  }
  
  private handleOrientationChange = (orientation: OrientationType) => {
    if (this.currentOrientation !== orientation) {
      this.currentOrientation = orientation;
      this.notifyListeners(orientation);
    }
  };
  
  private getCurrentOrientation() {
    Orientation.getOrientation((orientation) => {
      this.currentOrientation = orientation as OrientationType;
    });
  }
  
  private notifyListeners(orientation: OrientationType) {
    this.listeners.forEach(listener => listener(orientation));
  }
  
  // Add orientation change listener
  addListener(callback: (orientation: OrientationType) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Get current orientation
  getOrientation(): OrientationType {
    return this.currentOrientation;
  }
  
  // Cleanup
  destroy() {
    Orientation.removeOrientationListener(this.handleOrientationChange);
    this.listeners = [];
  }
}

// ✅ ORIENTATION-AWARE STYLES
export const getOrientationAwareStyles = () => {
  const { width, height, isLandscape } = OrientationDetector.getScreenDimensions();
  
  return {
    container: {
      width,
      height,
      flexDirection: isLandscape ? 'row' : 'column',
    },
    
    // Safe area adjustments
    safeArea: {
      paddingTop: isLandscape ? 0 : StatusBar.currentHeight || 0,
      paddingHorizontal: isLandscape ? 20 : 16,
    },
    
    // Content adjustments
    content: {
      flex: 1,
      paddingHorizontal: isLandscape ? 40 : 20,
      paddingVertical: isLandscape ? 20 : 30,
    },
    
    // Navigation adjustments
    navigation: {
      height: isLandscape ? 50 : 60,
      paddingHorizontal: isLandscape ? 20 : 16,
    },
    
    // Modal adjustments
    modal: {
      marginHorizontal: isLandscape ? width * 0.1 : 20,
      marginVertical: isLandscape ? height * 0.05 : 40,
    },
  };
};

// ✅ ORIENTATION UTILITIES
export const OrientationUtils = {
  // Apply orientation lock for specific screen
  applyScreenOrientationLock: (screenType: keyof typeof SCREEN_ORIENTATION_CONFIGS) => {
    const config = SCREEN_ORIENTATION_CONFIGS[screenType];
    
    if (config.supportedOrientations.length === 1) {
      const orientation = config.supportedOrientations[0];
      
      switch (orientation) {
        case 'portrait':
          OrientationManager.lockToPortrait();
          break;
        case 'landscape':
          OrientationManager.lockToLandscape();
          break;
        default:
          OrientationManager.unlockAllOrientations();
      }
    } else {
      OrientationManager.unlockAllOrientations();
    }
  },
  
  // Remove orientation lock
  removeOrientationLock: () => {
    OrientationManager.unlockAllOrientations();
  },
  
  // Get optimal layout for current orientation
  getOptimalLayout: () => {
    const { isLandscape, width, height } = OrientationDetector.getScreenDimensions();
    
    return {
      isLandscape,
      columns: isLandscape ? 3 : 2,
      itemWidth: isLandscape ? width / 3 - 20 : width / 2 - 20,
      itemHeight: isLandscape ? height / 2 - 20 : height / 3 - 20,
      spacing: isLandscape ? 15 : 10,
    };
  },
  
  // Handle orientation-specific navigation
  handleOrientationNavigation: (navigation: any, screenType: keyof typeof SCREEN_ORIENTATION_CONFIGS) => {
    // Apply orientation lock
    OrientationUtils.applyScreenOrientationLock(screenType);
    
    // Set navigation options
    navigation.setOptions(getOrientationAwareNavigationOptions(screenType));
    
    // Return cleanup function
    return () => {
      OrientationUtils.removeOrientationLock();
    };
  },
};

// ✅ SINGLETON ORIENTATION HANDLER
export const orientationHandler = new OrientationChangeHandler();

export default {
  OrientationDetector,
  OrientationManager,
  SCREEN_ORIENTATION_CONFIGS,
  getOrientationAwareNavigationOptions,
  OrientationChangeHandler,
  getOrientationAwareStyles,
  OrientationUtils,
  orientationHandler,
};
