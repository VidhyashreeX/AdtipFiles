package com.adtip;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.adtip.app.adtip_app.MainActivity;
import com.adtip.app.adtip_app.R;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class OngoingCallService extends Service {
    private static final String CHANNEL_ID = "OngoingCallChannel";
    private static final int NOTIFICATION_ID = 1;
    public static final String ACTION_END_CALL = "com.adtip.ACTION_END_CALL";
    public static final String ACTION_RETURN_TO_CALL = "com.adtip.ACTION_RETURN_TO_CALL";

    private final BroadcastReceiver callActionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action != null) {
                if (action.equals(ACTION_END_CALL)) {
                    sendEvent("EndCall", null);
                    stopSelf();
                }
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_END_CALL);
        registerReceiver(callActionReceiver, filter);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent.getStringExtra("title");
        String text = intent.getStringExtra("text");

        // Return to call intent
        Intent returnToCallIntent = new Intent(this, MainActivity.class);
        PendingIntent returnToCallPendingIntent = PendingIntent.getActivity(this, 0, returnToCallIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // End call intent
        Intent endCallIntent = new Intent(ACTION_END_CALL);
        PendingIntent endCallPendingIntent = PendingIntent.getBroadcast(this, 1, endCallIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(returnToCallPendingIntent)
                .setOngoing(true)
                .addAction(R.drawable.node_modules_reactnavigation_elements_lib_module_assets_closeicon, "End Call", endCallPendingIntent)
                .addAction(R.drawable.node_modules_reactnavigation_elements_lib_module_assets_backicon, "Return to Call", returnToCallPendingIntent)
                .build();

        startForeground(NOTIFICATION_ID, notification);
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterReceiver(callActionReceiver);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void sendEvent(String eventName, @Nullable String params) {
        try {
            ReactContext reactContext = OngoingCallModule.getReactContext();
            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, params);
            }
        } catch (Exception e) {
            // Handle exception
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Ongoing Call",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
} 