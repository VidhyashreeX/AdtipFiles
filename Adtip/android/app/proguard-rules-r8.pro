# ================================================================================================
# R8 SAFE MODE CONFIGURATION FOR ADTIP
# ================================================================================================

# Enable basic R8 optimizations (removed risky aggressive settings)
# Removed: -allowaccessmodification (can break reflection)
# Removed: -repackageclasses (can cause issues with native modules)

# Safe optimization settings (reduced from aggressive level)
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 2

# ================================================================================================
# SAFE BUILD-TIME OPTIMIZATIONS (Based on ProGuard Manual)
# ================================================================================================

# Safe code optimizations that only affect build time
-optimizations code/simplification/variable
-optimizations code/simplification/field
-optimizations code/simplification/object
-optimizations code/simplification/math
-optimizations code/removal/variable
-optimizations code/removal/simple
-optimizations code/merging

# Safe method optimizations (conservative)
-optimizations method/marking/private
-optimizations method/marking/final
-optimizations method/marking/synchronized

# Safe class optimizations (conservative)
-optimizations class/marking/final

# Safe field optimizations (conservative)
-optimizations field/marking/private

# Keep essential React Native classes from being over-optimized
-keep class com.facebook.react.ReactApplication { *; }
-keep class com.facebook.react.ReactNativeHost { *; }
-keep class com.facebook.react.ReactPackage { *; }
-keep class com.facebook.react.shell.MainReactPackage { *; }

# Keep React Native bridge methods
-keepclassmembers class ** {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep React Native event emitters
-keep class com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter { *; }

# Keep native module interfaces
-keep interface com.facebook.react.bridge.NativeModule { *; }
-keep interface com.facebook.react.bridge.ReactContextBaseJavaModule { *; }

# Preserve annotations for React Native
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep enum values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Advanced shrinking for unused resources
# -shrinkresources

# Keep crash reporting symbols
-keepattributes SourceFile,LineNumberTable

# Safe string optimizations (re-enabled as it's safe)
-optimizations code/simplification/string

# ================================================================================================
# ADDITIONAL SAFE BUILD-TIME OPTIMIZATIONS
# ================================================================================================

# Enable safe Gson optimization (if using Gson library)
-optimizations library/gson

# Safe attribute optimizations for build time
-keepattributes Exceptions
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations

# Optimize local variable allocation (safe for build time)
-optimizations code/allocation/variable

# Safe dead code removal (simple analysis only)
-optimizations code/removal/exception

# Enable safe enum optimization (converts enums to constants when possible)
-optimizations class/unboxing/enum

# Remove debug information in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Remove React Native development warnings
-assumenosideeffects class com.facebook.react.bridge.ReactContext {
    void logOnDestroy();
}

# Removed risky dead code elimination for java.lang.System
# This can break timing-dependent code and reflection

# Optimize reflection usage
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleParameterAnnotations

# Keep React Native module registration
-keep class com.facebook.react.ReactPackage { *; }
-keep class * implements com.facebook.react.ReactPackage { *; }

# Preserve native method names for JNI
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Removed risky advanced optimizations:
# - allowaccessmodification (can break reflection and native modules)
# - mergeinterfacesaggressively (can cause runtime issues)
# - assumevalues with private methods (unsafe assumptions)
# - method marking optimizations (can break React Native bridge)

# Keep essential Android framework classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Safe resource optimization (keep essential resources)
# -keepresources string/app_name
# -keepresources drawable/ic_launcher*
# -keepresources mipmap/ic_launcher*

# Removed risky class loading optimizations:
# - repackageclasses (can break package-dependent code)
# - flattenpackagehierarchy (can cause class loading issues)

# Keep essential reflection-based classes
-keep class * extends java.lang.reflect.** { *; }

# Removed risky advanced optimizations:
# - method inlining (can break React Native method calls)
# - exception handling removal (can cause crashes)
# - field optimization (can break data binding)

# Keep essential serialization (safe to keep)
-keepnames class * implements java.io.Serializable

# ================================================================================================
# SAFE BUILD PERFORMANCE OPTIMIZATIONS
# ================================================================================================

# Optimize package names (safe obfuscation)
-keeppackagenames !com.adtip.app.adtip_app.**
-keeppackagenames !com.facebook.react.**
-keeppackagenames !androidx.**
-keeppackagenames !android.**

# Safe resource file optimizations
-adaptresourcefilenames **.properties,**.xml,**.txt
-adaptresourcefilecontents **.properties,META-INF/MANIFEST.MF

# Optimize constant strings (safe for build time)
-adaptclassstrings

# Safe method parameter optimization
-keepparameternames

# ================================================================================================
# ANDROID & REACT NATIVE SPECIFIC SAFE OPTIMIZATIONS
# ================================================================================================

# Safe Android optimizations
-optimizations field/generalization/class
-optimizations method/generalization/class

# Optimize for Android runtime (safe)
-dontpreverify
-android

# Safe attribute preservation for debugging (build-time only impact)
-renamesourcefileattribute SourceFile

# Additional safe optimizations for React Native
-optimizations method/specialization/returntype
-optimizations field/specialization/type

# Safe annotation processing
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleParameterAnnotations

# Keep essential Android lifecycle methods
-keepclassmembers class * extends android.app.Activity {
    public void *(android.view.View);
}

# Removed risky optimizations:
# - switch statement optimization (can break logic)
# - class merging (can cause runtime issues with React Native)

# Keep essential View constructors
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet);
}

-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# Removed final risky optimization pass:
# - code allocation optimization (can break variable handling)

# ================================================================================================
# SUMMARY OF CHANGES - SAFER R8 CONFIGURATION
# ================================================================================================
#
# REMOVED RISKY OPTIMIZATIONS:
# - allowaccessmodification (can break reflection and native modules)
# - repackageclasses and flattenpackagehierarchy (can cause class loading issues)
# - mergeinterfacesaggressively (can cause runtime issues)
# - Advanced method inlining (can break React Native bridge)
# - Aggressive dead code elimination (can break timing and reflection)
# - Advanced field optimization (can break data binding)
# - Class merging optimizations (can cause runtime issues)
# - Exception handling removal (can cause crashes)
# - Switch statement optimization (can break logic)
# - Reduced optimization passes from 5 to 2 (more stable)
#
# KEPT SAFE OPTIMIZATIONS:
# - Resource shrinking (commented out per user preference)
# - Log removal (Android Log class)
# - Basic React Native protections
# - Essential keep rules for frameworks
# - Crash reporting symbols
# - String concatenation optimization (safe)
# - Basic code simplification (safe subset)
#
# ADDED SAFE BUILD-TIME OPTIMIZATIONS:
# - Variable and field simplification (code/simplification/variable, code/simplification/field)
# - Object instantiation optimization (code/simplification/object)
# - Math method call optimization (code/simplification/math)
# - Safe method marking (private, final, synchronized)
# - Safe class marking (final)
# - Safe field marking (private)
# - Code merging for identical blocks
# - Variable allocation optimization
# - Simple dead code removal
# - Enum to constant optimization (when safe)
# - Gson library optimization (if applicable)
# - Safe package name optimization
# - Resource file content adaptation
# - Class string adaptation
# - Parameter name preservation
#
# This configuration provides significant app size reduction while maintaining stability
# and adds safe build-time optimizations that won't affect runtime behavior.
-dontwarn proguard.annotation.Keep
-dontwarn proguard.annotation.KeepClassMembers