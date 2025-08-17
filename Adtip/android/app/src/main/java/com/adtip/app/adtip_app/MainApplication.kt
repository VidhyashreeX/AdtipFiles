package com.adtip.app.adtip_app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
// CALLKEEP DISABLED - Causing white screen on Vivo devices
// import io.wazo.callkeep.RNCallKeepPackage;

// VideoSDK Imports
import live.videosdk.rnwebrtc.WebRTCModulePackage
import live.videosdk.rnincallmanager.InCallManagerPackage

// PubScale Offerwall Import
import com.adtip.app.adtip_app.PubscaleOfferwallPackage

// Call Ringing Service Import
import com.adtip.app.adtip_app.CallRingingPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages.toMutableList()
        
        // Add manually linked VideoSDK packages
        packages.add(WebRTCModulePackage())
        packages.add(InCallManagerPackage())
        // pubscale
        packages.add(PubscaleOfferwallPackage())
        // Call ringing service for proper ringtone and vibration
        packages.add(CallRingingPackage())
        // CALLKEEP DISABLED - Causing white screen on Vivo devices
        // Add CallKeep package for native call handling
        // packages.add(RNCallKeepPackage());
        
        return packages
      }

      override fun getJSMainModuleName(): String = "index"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    try {
      SoLoader.init(this, OpenSourceMergedSoMapping)
      if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        load()
      }
    } catch (e: Exception) {
      // Log the error and try fallback initialization
      android.util.Log.e("MainApplication", "SoLoader initialization failed", e)
      try {
        // Fallback: Initialize SoLoader without merged mapping
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
          load()
        }
      } catch (fallbackException: Exception) {
        android.util.Log.e("MainApplication", "SoLoader fallback initialization also failed", fallbackException)
        // Continue anyway - the app might still work
      }
    }
  }
}
