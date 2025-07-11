# ================================================================================================
# R8 FULL MODE CONFIGURATION FOR ADTIP
# ================================================================================================

# Enable R8 full mode optimizations
-allowaccessmodification
-repackageclasses ''

# Aggressive optimization settings
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5

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
-shrinkresources

# Keep crash reporting symbols
-keepattributes SourceFile,LineNumberTable

# Optimize string concatenation
-optimizations !code/simplification/string

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

# Advanced dead code elimination
-assumenosideeffects class java.lang.System {
    public static long currentTimeMillis();
    static java.lang.Class getCallerClass();
}

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

# Advanced optimization for final classes
-allowaccessmodification
-mergeinterfacesaggressively

# Remove unused parameters in private methods
-assumevalues class * {
    private *** *(...) return null;
}

# Optimize method calls
-optimizations !method/marking/private,!method/marking/static

# Keep essential Android framework classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Advanced resource optimization
-keepresources string/app_name
-keepresources drawable/ic_launcher*
-keepresources mipmap/ic_launcher*

# Optimize class loading
-repackageclasses 'o'
-flattenpackagehierarchy 'o'

# Keep essential reflection-based classes
-keep class * extends java.lang.reflect.** { *; }

# Advanced method inlining
-optimizations !method/inlining/unique,!method/inlining/short,!method/inlining/tailrecursion

# Remove unused exception handling
-optimizations !code/removal/exception

# Keep essential serialization
-keepnames class * implements java.io.Serializable

# Advanced field optimization
-optimizations !field/removal/writeonly,!field/marking/private

# Keep essential Android lifecycle methods
-keepclassmembers class * extends android.app.Activity {
    public void *(android.view.View);
}

# Optimize switch statements
-optimizations !code/simplification/branch

# Advanced class merging
-optimizations !class/merging/vertical,!class/merging/horizontal

# Keep essential View constructors
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet);
}

-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# Final optimization pass
-optimizations !code/allocation/variable
