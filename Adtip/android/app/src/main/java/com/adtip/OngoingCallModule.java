package com.adtip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class OngoingCallModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;

    public OngoingCallModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    public static ReactContext getReactContext() {
        return reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "OngoingCall";
    }

    @ReactMethod
    public void startOngoingCallNotification(String title, String text) {
        Intent serviceIntent = new Intent(getReactApplicationContext(), OngoingCallService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("text", text);
        serviceIntent.setAction(OngoingCallService.ACTION_START_FOREGROUND_SERVICE);
        getReactApplicationContext().startService(serviceIntent);
    }

    @ReactMethod
    public void stopOngoingCallNotification() {
        Intent serviceIntent = new Intent(getReactApplicationContext(), OngoingCallService.class);
        serviceIntent.setAction(OngoingCallService.ACTION_STOP_FOREGROUND_SERVICE);
        getReactApplicationContext().startService(serviceIntent);
    }

    public static class EndCallReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("EndCall", null);
            }
            // Also stop the service
            Intent serviceIntent = new Intent(context, OngoingCallService.class);
            serviceIntent.setAction(OngoingCallService.ACTION_STOP_FOREGROUND_SERVICE);
            context.startService(serviceIntent);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for new RN versions.
    }

    @ReactMethod
    public void removeListeners(int count) {
        // Required for new RN versions.
    }
} 