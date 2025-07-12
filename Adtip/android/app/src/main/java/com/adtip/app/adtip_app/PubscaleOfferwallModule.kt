package com.adtip.app.adtip_app

import android.app.Activity
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.pubscale.sdkone.offerwall.OfferWall
import com.pubscale.sdkone.offerwall.OfferWallConfig
import com.pubscale.sdkone.offerwall.models.OfferWallInitListener
import com.pubscale.sdkone.offerwall.models.OfferWallListener
import com.pubscale.sdkone.offerwall.models.Reward
import com.pubscale.sdkone.offerwall.models.errors.InitError

@ReactModule(name = PubscaleOfferwallModule.NAME)
class PubscaleOfferwallModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "PubscaleOfferwall"
        private const val TAG = "PubscaleOfferwall"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun init(appKey: String, parameters: ReadableMap, onSuccess: Callback?, onFailure: Callback?) {
        val activity = currentActivity
        if (activity == null) {
            onFailure?.invoke("Activity is null")
            return
        }

        val userId = parameters.getStringSafe("user_id")
        val backgroundBase64 = parameters.getStringSafe("background_Base64")
        val appIconBase64 = parameters.getStringSafe("appicon_Base64")
        val sandbox = parameters.getBooleanSafe("sandbox")
        val fullscreen = parameters.getBooleanSafe("fullscreen")

        activity.runOnUiThread {
            val configBuilder = OfferWallConfig.Builder(reactApplicationContext, appKey)
                .setFullscreenEnabled(fullscreen)
                .setSandboxEnabled(sandbox)

            if (!userId.isNullOrBlank()) {
                configBuilder.setUniqueId(userId)
            }

            backgroundBase64?.let {
                try {
                    val decoded = Base64.decode(it, Base64.DEFAULT)
                    val bitmap = BitmapFactory.decodeByteArray(decoded, 0, decoded.size)
                    configBuilder.setLoaderBackgroundBitmap(bitmap)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to decode background image", e)
                }
            }

            appIconBase64?.let {
                try {
                    val decoded = Base64.decode(it, Base64.DEFAULT)
                    val bitmap = BitmapFactory.decodeByteArray(decoded, 0, decoded.size)
                    configBuilder.setLoaderForegroundBitmap(bitmap)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to decode app icon", e)
                }
            }

            val offerWallConfig = configBuilder.build()

            OfferWall.init(offerWallConfig, object : OfferWallInitListener {
                override fun onInitSuccess() {
                    Log.i(TAG, "Offerwall init success")
                    onSuccess?.invoke()
                }

                override fun onInitFailed(error: InitError) {
                    Log.e(TAG, "Offerwall init failed: ${error.message}")
                    onFailure?.invoke(error.message)
                }
            })
        }
    }

    @ReactMethod
    fun launch(
        onShow: Callback?,
        onClose: Callback?,
        onReward: Callback?,
        onFailure: Callback?
    ) {
        val activity = currentActivity
        if (activity == null) {
            onFailure?.invoke("Activity is null")
            return
        }

        activity.runOnUiThread {
            val offerWallListener = object : OfferWallListener {

                override fun onOfferWallShowed() {
                    Log.d(TAG, "Offerwall showed")
                    onShow?.invoke()
                }

                override fun onOfferWallClosed() {
                    Log.d(TAG, "Offerwall closed")
                    onClose?.invoke()
                }

                override fun onRewardClaimed(reward: Reward) {
                    Log.d(TAG, "Offerwall reward received")
                    onReward?.invoke(reward.amount, reward.currency, reward.token)
                }

                override fun onFailed(message: String) {
                    Log.d(TAG, "Offerwall failed: $message")
                    onFailure?.invoke(message)
                }
            }
            OfferWall.launch(activity, offerWallListener)
        }
    }

    @ReactMethod
    fun destroy() {
        OfferWall.destroy()
    }

    // Extension functions to safely get values from ReadableMap
    private fun ReadableMap.getStringSafe(key: String): String? {
        return if (hasKey(key) && getType(key) == ReadableType.String) getString(key) else null
    }

    private fun ReadableMap.getBooleanSafe(key: String): Boolean {
        return hasKey(key) && getType(key) == ReadableType.Boolean && getBoolean(key)
    }
}