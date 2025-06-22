package com.adtip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.annotation.NonNull;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class IncomingCallModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "IncomingCallModule";
    private static ReactApplicationContext reactContext;
    private BroadcastReceiver callReceiver;

    public IncomingCallModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        setupBroadcastReceiver();
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    private void setupBroadcastReceiver() {
        callReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("ADTIP_INCOMING_CALL_RECEIVED".equals(intent.getAction())) {
                    WritableMap params = Arguments.createMap();
                    params.putString("callerName", intent.getStringExtra("callerName"));
                    params.putString("callType", intent.getStringExtra("callType"));
                    params.putString("callerId", intent.getStringExtra("callerId"));
                    params.putString("channelName", intent.getStringExtra("channelName"));
                    params.putString("meetingId", intent.getStringExtra("meetingId"));
                    params.putString("token", intent.getStringExtra("token"));
                    params.putBoolean("isIncomingCall", intent.getBooleanExtra("isIncomingCall", false));

                    sendEvent("ADTIP_INCOMING_CALL_RECEIVED", params);
                }
            }
        };

        IntentFilter filter = new IntentFilter("ADTIP_INCOMING_CALL_RECEIVED");
        LocalBroadcastManager.getInstance(reactContext).registerReceiver(callReceiver, filter);
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN 0.65+
    }

    @ReactMethod
    public void removeListeners(int count) {
        // Required for RN 0.65+
    }

    @Override
    public void onCatalystInstanceDestroy() {
        if (callReceiver != null) {
            LocalBroadcastManager.getInstance(reactContext).unregisterReceiver(callReceiver);
        }
        super.onCatalystInstanceDestroy();
    }
}
