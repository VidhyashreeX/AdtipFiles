package com.adtip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.annotation.NonNull;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import javax.annotation.Nullable;

public class IncomingCallModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "IncomingCallModule";
    private ReactApplicationContext reactContext;
    private BroadcastReceiver callActionReceiver;

    public IncomingCallModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        callActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent != null && intent.getAction() != null) {
                    WritableMap params = Arguments.createMap();
                    params.putString("action", intent.getAction());
                    params.putString("sessionId", intent.getStringExtra("sessionId"));
                    sendEvent("onCallAction", params);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction("ANSWER");
        filter.addAction("DECLINE");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
             reactContext.registerReceiver(callActionReceiver, filter, ReactApplicationContext.RECEIVER_NOT_EXPORTED);
        } else {
             reactContext.registerReceiver(callActionReceiver, filter);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    private void setupCallActionReceiver() {
        callActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("com.adtip.CALL_ACTION".equals(intent.getAction())) {
                    String action = intent.getStringExtra("action");
                    String sessionId = intent.getStringExtra("sessionId");
                    
                    sendEvent("callAction", createCallActionMap(action, sessionId));
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.adtip.CALL_ACTION");
        reactContext.registerReceiver(callActionReceiver, filter);
    }

    private com.facebook.react.bridge.WritableMap createCallActionMap(String action, String sessionId) {
        com.facebook.react.bridge.WritableMap params = com.facebook.react.bridge.Arguments.createMap();
        params.putString("action", action);
        params.putString("sessionId", sessionId);
        return params;
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @ReactMethod
    public void showIncomingCall(String callerName, String callType, String sessionId) {
        Intent intent = new Intent(reactContext, IncomingCallActivity.class);
        intent.putExtra("callerName", callerName);
        intent.putExtra("callType", callType);
        intent.putExtra("sessionId", sessionId);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built-in Event Emitter Calls
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built-in Event Emitter Calls
    }

    // FIXED: Replace deprecated onCatalystInstanceDestroy with invalidate
    @Override
    public void invalidate() {
        if (callActionReceiver != null) {
            try {
                reactContext.unregisterReceiver(callActionReceiver);
            } catch (IllegalArgumentException e) {
                // Receiver was not registered
            }
            callActionReceiver = null;
        }
        super.invalidate();
    }
}
