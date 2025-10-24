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

# ================================================================================================
# CAMERA AND MEDIA MODULES
# ================================================================================================

# React Native Vision Camera
-keep class com.mrousavy.camera.** { *; }
-keep class com.mrousavy.camera.core.** { *; }
-keep class com.mrousavy.camera.frameprocessor.** { *; }
-dontwarn com.mrousavy.camera.**

# React Native Image Picker
-keep class com.imagepicker.** { *; }
-keep class com.reactnative.imagepicker.** { *; }
-dontwarn com.imagepicker.**
-dontwarn com.reactnative.imagepicker.**

# React Native Image Crop Picker
-keep class com.reactnative.ivpusic.imagepicker.** { *; }
-keep class com.theartofdev.edmodo.cropper.** { *; }
-dontwarn com.reactnative.ivpusic.imagepicker.**
-dontwarn com.theartofdev.edmodo.cropper.**

# React Native Camera Roll
-keep class com.reactnativecommunity.cameraroll.** { *; }
-dontwarn com.reactnativecommunity.cameraroll.**

# React Native Compressor
-keep class com.reactnativecompressor.** { *; }
-dontwarn com.reactnativecompressor.**

# React Native Create Thumbnail
-keep class com.createthumbnail.** { *; }
-dontwarn com.createthumbnail.**

# ================================================================================================
# WEBRTC AND VIDEO CALLING MODULES
# ================================================================================================

# VideoSDK.live
-keep class live.videosdk.** { *; }
-keep class com.videosdk.** { *; }
-keep class live.videosdk.rtc.** { *; }
-keep class live.videosdk.rtc.android.** { *; }
-dontwarn live.videosdk.**
-dontwarn com.videosdk.**

# WebRTC
-keep class org.webrtc.** { *; }
-keep class com.oney.WebRTCModule.** { *; }
-dontwarn org.webrtc.**
-dontwarn com.oney.WebRTCModule.**

# React Native WebRTC
-keep class com.reactnativewebrtc.** { *; }
-dontwarn com.reactnativewebrtc.**

# ================================================================================================
# REACT NATIVE SCREENS
# ================================================================================================

# React Native Screens - Fix for IllegalStateException crashes
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.rnscreens.ScreenFragment { *; }
-keep class com.swmansion.rnscreens.ScreenStackFragment { *; }
-keep class com.swmansion.rnscreens.Screen { *; }
-keep class com.swmansion.rnscreens.ScreenStack { *; }
-dontwarn com.swmansion.rnscreens.**

# Keep all constructors for Screen fragments
-keepclassmembers class com.swmansion.rnscreens.ScreenFragment {
    <init>(...);
}
-keepclassmembers class com.swmansion.rnscreens.ScreenStackFragment {
    <init>(...);
}

# ================================================================================================
# NATIVE MODULE REGISTRATION
# ================================================================================================

# Keep native module registration methods
-keep class com.facebook.react.NativeModuleRegistryBuilder { *; }
-keep class com.facebook.react.ReactPackage { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.ReactMethod { *; }

# Keep all classes that implement ReactPackage
-keep class * implements com.facebook.react.ReactPackage {
    public <methods>;
}

# Keep all classes that extend ReactContextBaseJavaModule
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    public <methods>;
}

# Prevent obfuscation of native module names
-keepnames class * extends com.facebook.react.bridge.ReactContextBaseJavaModule
-keepnames class * implements com.facebook.react.ReactPackage

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

# OkHttp - Complete rules to prevent WebSocket crashes
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# OkHttp WebSocket - Critical for preventing MessageDeflater crashes
-keep class okhttp3.internal.ws.** { *; }
-keep class okhttp3.internal.ws.WebSocketReader { *; }
-keep class okhttp3.internal.ws.WebSocketWriter { *; }
-keep class okhttp3.internal.ws.MessageDeflater { *; }
-keep class okhttp3.internal.ws.MessageInflater { *; }
-keep class okhttp3.internal.ws.RealWebSocket { *; }
-keep class okhttp3.internal.ws.RealWebSocket$* { *; }
-keepclassmembers class okhttp3.internal.ws.RealWebSocket {
    *;
}
-keepclassmembers class okhttp3.internal.ws.MessageDeflater {
    *;
}

# OkHttp Interceptors and Connection Pool
-keep class okhttp3.internal.** { *; }
-keep class okhttp3.Request { *; }
-keep class okhttp3.Response { *; }
-keep class okhttp3.Call { *; }
-keep class okhttp3.Callback { *; }
-keep class okhttp3.EventListener { *; }

# Okio - Required by OkHttp
-keep class okio.** { *; }
-dontwarn okio.**
-keep class okio.Buffer { *; }
-keep class okio.BufferedSource { *; }
-keep class okio.BufferedSink { *; }

# Socket.IO (uses OkHttp underneath)
-keep class io.socket.** { *; }
-keep class io.socket.client.** { *; }
-keep class io.socket.emitter.** { *; }
-keep class io.socket.engineio.** { *; }
-keep class io.socket.engineio.client.** { *; }
-dontwarn io.socket.**

# Socket.IO Engine.IO transport
-keep class io.socket.engineio.client.transports.** { *; }
-keep class io.socket.engineio.client.Transport { *; }
-keep class io.socket.engineio.client.Transport$* { *; }

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