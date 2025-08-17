package com.adtip.app.adtip_app;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

/**
 * React Native module to control call ringing service
 * Provides bridge to CallRingingService for proper ringtone and vibration
 */
public class CallRingingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CallRingingModule";
    private ReactApplicationContext reactContext;

    public CallRingingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "CallRingingModule";
    }

    /**
     * Start ringing with device default ringtone and vibration
     */
    @ReactMethod
    public void startRinging(String callerName, String sessionId, Promise promise) {
        try {
            Log.d(TAG, "Starting ringing for caller: " + callerName + ", session: " + sessionId);
            
            Context context = getReactApplicationContext();
            Intent intent = new Intent(context, CallRingingService.class);
            intent.setAction(CallRingingService.ACTION_START_RINGING);
            intent.putExtra(CallRingingService.EXTRA_CALLER_NAME, callerName);
            intent.putExtra(CallRingingService.EXTRA_SESSION_ID, sessionId);
            
            context.startService(intent);
            
            Log.d(TAG, "Ringing service started successfully");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start ringing service", e);
            promise.reject("RINGING_START_ERROR", "Failed to start ringing: " + e.getMessage());
        }
    }

    /**
     * Stop ringing
     */
    @ReactMethod
    public void stopRinging(Promise promise) {
        try {
            Log.d(TAG, "Stopping ringing");
            
            Context context = getReactApplicationContext();
            Intent intent = new Intent(context, CallRingingService.class);
            intent.setAction(CallRingingService.ACTION_STOP_RINGING);
            
            context.startService(intent);
            
            Log.d(TAG, "Ringing service stopped successfully");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop ringing service", e);
            promise.reject("RINGING_STOP_ERROR", "Failed to stop ringing: " + e.getMessage());
        }
    }

    /**
     * Check if ringing service is available
     */
    @ReactMethod
    public void isRingingServiceAvailable(Promise promise) {
        try {
            // Always available on Android
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error checking ringing service availability", e);
            promise.resolve(false);
        }
    }
}
