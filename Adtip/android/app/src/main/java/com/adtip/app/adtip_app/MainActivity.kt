package com.adtip.app.adtip_app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle

import io.wazo.callkeep.RNCallKeepModule;
import androidx.annotation.NonNull;

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Adtip"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Fix for react-native-screens fragment restoration crash
   * See: https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  /**
   * Handle permission results for CallKeep
   */
  override fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<out String>,
      grantResults: IntArray
  ) {
      super.onRequestPermissionsResult(requestCode, permissions, grantResults)
      when (requestCode) {
          RNCallKeepModule.REQUEST_READ_PHONE_STATE -> {
              RNCallKeepModule.onRequestPermissionsResult(requestCode, permissions, grantResults)
          }
          // Add other permission request cases if needed
      }
  }
}
