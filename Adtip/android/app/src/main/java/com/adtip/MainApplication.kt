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
import com.adtip.OngoingCallPackage
import com.adtip.IncomingCallPackage  // CRITICAL FIX: Add IncomingCallPackage

// VideoSDK Imports
import live.videosdk.rnwebrtc.WebRTCModulePackage
import live.videosdk.rnfgservice.ForegroundServicePackage
import live.videosdk.rnincallmanager.InCallManagerPackage

// ExoPlayer Package Import - ENSURE THIS IS CORRECT
import com.adtip.app.adtip_app.ExoPlayerPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages.toMutableList()
        
        // Add manually linked VideoSDK packages
        packages.add(WebRTCModulePackage())
        packages.add(ForegroundServicePackage())
        packages.add(InCallManagerPackage())
        
        // Add ExoPlayer Package - CRITICAL FOR TIPSHORTS ENHANCED
        packages.add(ExoPlayerPackage())
          // Add OngoingCallPackage
        packages.add(OngoingCallPackage())
        
        // CRITICAL FIX: Add IncomingCallPackage for native call handling
        packages.add(IncomingCallPackage())
        
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
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}
