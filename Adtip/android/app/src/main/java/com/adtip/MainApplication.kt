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
import live.videosdk.rnwebrtc.WebRTCModulePackage
// Commented out PubScale integration - June 2, 2025
//import com.adtip.app.adtip_app.PubscaleOfferwallSdkPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =      object : DefaultReactNativeHost(this) {        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              // Commented out PubScale integration - June 2, 2025
              //packages.add(PubscaleOfferwallSdkPackage());
            }

        override fun getJSMainModuleName(): String = "index"
        override fun getPackages(): List<ReactPackage> {
            @Suppress("UnnecessaryLocalVariable")
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(MyReactNativePackage())
            packages.add(WebRTCModulePackage())
            return packages
        }

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
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }
}
