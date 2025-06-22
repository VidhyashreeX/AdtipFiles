package com.adtip;

import android.content.Intent;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

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
        getReactApplicationContext().startService(serviceIntent);
    }

    @ReactMethod
    public void stopOngoingCallNotification() {
        getReactApplicationContext().stopService(new Intent(getReactApplicationContext(), OngoingCallService.class));
    }
} 