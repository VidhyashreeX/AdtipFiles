package com.adtip;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.os.Vibrator;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;

public class IncomingCallModule extends ReactContextBaseJavaModule {
    private static final String TAG = "IncomingCallModule";
    private static final String MODULE_NAME = "IncomingCallModule";
    
    // Event names
    private static final String INCOMING_CALL_EVENT = "ADTIP_INCOMING_CALL_RECEIVED";
    private static final String CALL_ACTION_EVENT = "onCallAction";
    
    // Broadcast actions
    private static final String ACTION_INCOMING_CALL = "com.adtip.INCOMING_CALL";
    private static final String ACTION_CALL_ANSWER = "com.adtip.CALL_ANSWER";
    private static final String ACTION_CALL_DECLINE = "com.adtip.CALL_DECLINE";
    
    private ReactApplicationContext reactContext;
    private BroadcastReceiver callReceiver;
    private MediaPlayer ringtonePlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private boolean isRinging = false;

    public IncomingCallModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.vibrator = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
        
        // Initialize wake lock for keeping screen on during calls
        PowerManager powerManager = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "AdtipCall:IncomingCallWakeLock"
            );
        }
        
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
                String action = intent.getAction();
                Log.d(TAG, "Broadcast received: " + action);
                
                if (ACTION_INCOMING_CALL.equals(action)) {
                    handleIncomingCallBroadcast(intent);
                } else if (ACTION_CALL_ANSWER.equals(action)) {
                    handleCallAnswer(intent);
                } else if (ACTION_CALL_DECLINE.equals(action)) {
                    handleCallDecline(intent);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_INCOMING_CALL);
        filter.addAction(ACTION_CALL_ANSWER);
        filter.addAction(ACTION_CALL_DECLINE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(callReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            reactContext.registerReceiver(callReceiver, filter);
        }
    }

    private void handleIncomingCallBroadcast(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras == null) return;
        
        String sessionId = extras.getString("sessionId");
        String callerName = extras.getString("callerName");
        String callType = extras.getString("callType");
        String meetingId = extras.getString("meetingId");
        String token = extras.getString("token");
        
        Log.d(TAG, "Incoming call: " + callerName + " (" + callType + ")");
        
        // Start comprehensive ringing using dedicated service
        CallRingingService.startRinging(reactContext, callerName, sessionId);

        // Wake up device
        wakeUpDevice();
        
        // Send event to React Native
        WritableMap params = Arguments.createMap();
        params.putString("sessionId", sessionId);
        params.putString("callerName", callerName);
        params.putString("callType", callType);
        params.putString("meetingId", meetingId);
        params.putString("token", token);
        params.putBoolean("isIncomingCall", true);
        
        sendEvent(INCOMING_CALL_EVENT, params);
    }

    private void handleCallAnswer(Intent intent) {
        String sessionId = intent.getStringExtra("sessionId");
        Log.d(TAG, "Call answered: " + sessionId);
        
        // Stop ringing service
        CallRingingService.stopRinging(reactContext);
        releaseWakeLock();
        
        WritableMap params = Arguments.createMap();
        params.putString("action", "ANSWER");
        params.putString("sessionId", sessionId);
        
        sendEvent(CALL_ACTION_EVENT, params);
    }

    private void handleCallDecline(Intent intent) {
        String sessionId = intent.getStringExtra("sessionId");
        Log.d(TAG, "Call declined: " + sessionId);
        
        // Stop ringing service
        CallRingingService.stopRinging(reactContext);
        releaseWakeLock();
        
        WritableMap params = Arguments.createMap();
        params.putString("action", "DECLINE");
        params.putString("sessionId", sessionId);
        
        sendEvent(CALL_ACTION_EVENT, params);
    }

    private void startRinging() {
        if (isRinging) return;
        
        isRinging = true;
        
        // Start vibration
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = {0, 1000, 500, 1000, 500, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(android.os.VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
        
        // Start ringtone
        startRingtone();
    }

    private void startRingtone() {
        try {
            if (ringtonePlayer != null) {
                ringtonePlayer.release();
            }
            
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            ringtonePlayer = new MediaPlayer();
            ringtonePlayer.setDataSource(reactContext, ringtoneUri);
            ringtonePlayer.setAudioStreamType(AudioManager.STREAM_RING);
            ringtonePlayer.setLooping(true);
            ringtonePlayer.prepare();
            ringtonePlayer.start();
            
            Log.d(TAG, "Ringtone started");
        } catch (IOException e) {
            Log.e(TAG, "Failed to start ringtone", e);
        }
    }

    private void stopRinging() {
        if (!isRinging) return;
        
        isRinging = false;
        
        // Stop vibration
        if (vibrator != null) {
            vibrator.cancel();
        }
        
        // Stop ringtone
        if (ringtonePlayer != null) {
            try {
                if (ringtonePlayer.isPlaying()) {
                    ringtonePlayer.stop();
                }
                ringtonePlayer.release();
                ringtonePlayer = null;
                Log.d(TAG, "Ringtone stopped");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping ringtone", e);
            }
        }
    }

    private void wakeUpDevice() {
        try {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(30000); // 30 seconds timeout
                Log.d(TAG, "Wake lock acquired");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to acquire wake lock", e);
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                Log.d(TAG, "Wake lock released");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to release wake lock", e);
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void triggerIncomingCall(String sessionId, String callerName, String callType, String meetingId, String token) {
        Log.d(TAG, "Triggering incoming call: " + callerName);
        
        Intent intent = new Intent(ACTION_INCOMING_CALL);
        intent.putExtra("sessionId", sessionId);
        intent.putExtra("callerName", callerName);
        intent.putExtra("callType", callType);
        intent.putExtra("meetingId", meetingId);
        intent.putExtra("token", token);
        
        reactContext.sendBroadcast(intent);
    }

    @ReactMethod
    public void endCall() {
        Log.d(TAG, "Ending call");
        CallRingingService.stopRinging(reactContext);
        releaseWakeLock();
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        
        if (callReceiver != null) {
            try {
                reactContext.unregisterReceiver(callReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
        }
        
        CallRingingService.stopRinging(reactContext);
        releaseWakeLock();
    }
}
