package com.adtip;

import android.app.Activity;
import android.content.Intent;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class OngoingCallModule extends ReactContextBaseJavaModule {

    public OngoingCallModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "OngoingCall";
    }

    @ReactMethod
    public void startOngoingCallNotification(String title, String text) {
        ReactApplicationContext context = getReactApplicationContext();
        Intent serviceIntent = new Intent(context, OngoingCallService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("text", text);
        context.startService(serviceIntent);
    }

    @ReactMethod
    public void stopOngoingCallNotification() {
        ReactApplicationContext context = getReactApplicationContext();
        context.stopService(new Intent(context, OngoingCallService.class));
    }
} 