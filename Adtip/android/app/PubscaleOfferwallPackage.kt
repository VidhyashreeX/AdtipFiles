package com.anonymous.demoandroidjava.kotlin

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * PubscaleOfferwallPackage is the React Native package responsible for exposing
 * native Offerwall functionality to JavaScript via PubscaleOfferwallModule.
 */
class PubscaleOfferwallPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PubscaleOfferwallModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        // No custom view managers are used
        return emptyList()
    }
}