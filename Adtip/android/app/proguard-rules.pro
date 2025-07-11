# ================================================================================================
# ADTIP REACT NATIVE PRODUCTION PROGUARD RULES
# ================================================================================================

# Basic ProGuard configuration
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose
-dontoptimize
-dontpreverify

# Keep line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ================================================================================================
# REACT NATIVE CORE RULES
# ================================================================================================

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep React Native bridge classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }

# Keep React Native modules
-keep class com.facebook.react.modules.** { *; }

# Keep JSC/Hermes
-keep class com.facebook.soloader.** { *; }

# Keep React Native DevSupport (can be removed in production)
-keep class com.facebook.react.devsupport.** { *; }

# ================================================================================================
# JAVASCRIPT INTERFACE RULES
# ================================================================================================

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep classes with native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# ================================================================================================
# REACT NATIVE THIRD-PARTY LIBRARIES
# ================================================================================================

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# React Native Fast Image
-keep class com.dylanvann.fastimage.** { *; }

# React Native FS
-keep class com.rnfs.** { *; }

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# React Native DateTimePicker
-keep class com.reactnativecommunity.datetimepicker.** { *; }

# React Native Blur
-keep class com.cmcewen.blurview.** { *; }

# ================================================================================================
# FIREBASE RULES
# ================================================================================================

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Crashlytics
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# ================================================================================================
# VIDEO SDK RULES
# ================================================================================================

# VideoSDK WebRTC
-keep class org.webrtc.** { *; }
-keep class com.videosdk.** { *; }
-dontwarn org.webrtc.**

# ================================================================================================
# EXOPLAYER RULES
# ================================================================================================

# ExoPlayer
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**

# ================================================================================================
# PUBSCALE INTEGRATION RULES
# ================================================================================================

# PubScale integration
-keep class com.pubscale.sdkone.offerwall.** {*;}
-keep class com.pubscale.caterpillar.analytics.** {*;}

# ================================================================================================
# NETWORKING RULES
# ================================================================================================

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Retrofit
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ================================================================================================
# KOTLIN COROUTINES RULES
# ================================================================================================

# Supporting R8 full mode
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ================================================================================================
# GENERAL ANDROID RULES
# ================================================================================================

# Keep Android Support/AndroidX
-keep class android.support.** { *; }
-keep class androidx.** { *; }
-dontwarn android.support.**
-dontwarn androidx.**

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ================================================================================================
# OPTIMIZATION RULES
# ================================================================================================

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Remove React Native debug logging
-assumenosideeffects class com.facebook.react.bridge.ReactContext {
    void logOnDestroy();
}

# ================================================================================================
# CUSTOM APP RULES
# ================================================================================================

# Keep your main application class
-keep class com.adtip.app.adtip_app.MainApplication { *; }
-keep class com.adtip.app.adtip_app.MainActivity { *; }

# Keep any custom native modules
-keep class com.adtip.app.adtip_app.** { *; }