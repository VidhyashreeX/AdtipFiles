/*

{
  "expo": {
    "name": "Adtip App", // Display name on device
    "slug": "adtip-app", // Unique identifier for Expo
    "version": "1.0.0", // App version
    "scheme": "adtipapp", // Custom URI scheme (changed from "acme" to match slug)
    "userInterfaceStyle": "automatic", // Light/dark mode support
    "orientation": "default", // Allow portrait and landscape
    "platforms": ["ios", "android", "web"], // Explicitly support all platforms
    "icon": "./assets/icon.png", // App icon (1024x1024 PNG)
    "splash": {
      "image": "./assets/splash.png", // Splash screen (1242x2436 PNG recommended)
      "resizeMode": "contain",
      "backgroundColor": "#ffffff" // White background for splash
    },
    "android": {
      "package": "com.adtip.app", // Unique Android package name
      "icon": "./assets/icon.png", // Android-specific icon
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png", // For Android 8.0+
        "backgroundColor": "#ffffff"
      },
      "permissions": [], // Minimize permissions for security
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.adtip.app", // Unique iOS bundle ID
      "icon": "./assets/icon.png", // iOS-specific icon
      "buildNumber": "1.0.0",
      "supportsTablet": true // Support iPads
    },
    "web": {
      "output": "static", // Static output for web
      "favicon": "./assets/favicon.png" // Web favicon (32x32 or 64x64 PNG)
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://n" // Ensure this is a valid URL or remove if not needed
        }
      ],
      "expo-build-properties", // Ensure compatibility with native builds
      [
        "expo-font",
        {
          "fonts": ["./assets/fonts/YourFont-Regular.ttf"] // Add custom fonts if used
        }
      ]
    ],
    "experiments": {
      "tsconfigPaths": true, // Support @/ imports
      "typedRoutes": true // Type-safe routing with Expo Router
    }
  }
}

*/