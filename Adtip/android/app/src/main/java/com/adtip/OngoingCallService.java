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
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.service.notification.StatusBarNotification;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.adtip.app.adtip_app.MainActivity;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class OngoingCallService extends Service {
    public static final String ACTION_START_FOREGROUND_SERVICE = "ACTION_START_FOREGROUND_SERVICE";
    public static final String ACTION_STOP_FOREGROUND_SERVICE = "ACTION_STOP_FOREGROUND_SERVICE";
    private static final String TAG = "OngoingCallService";
    private static final String CHANNEL_ID = "OngoingCallChannel";
    private static final int NOTIFICATION_ID = 1;

    public static final String ACTION_END_CALL = "com.adtip.END_CALL";

    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        OngoingCallService getService() {
            return OngoingCallService.this;
        }
    }

    private final BroadcastReceiver endCallReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && ACTION_END_CALL.equals(intent.getAction())) {
                // Stop the service
                stopSelf();

                // Send event to React Native to end the call
                ReactApplicationContext reactContext = (ReactApplicationContext) getApplicationContext();
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("EndCall", null);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        IntentFilter filter = new IntentFilter(ACTION_END_CALL);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(endCallReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(endCallReceiver, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_START_FOREGROUND_SERVICE.equals(action)) {
                String title = intent.getStringExtra("title");
                String text = intent.getStringExtra("text");
                showNotification(title, text);
            } else if (ACTION_STOP_FOREGROUND_SERVICE.equals(action)) {
                stopForegroundService();
            }
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterReceiver(endCallReceiver);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    private void showNotification(String title, String text) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE);

        Intent endCallIntent = new Intent(ACTION_END_CALL);
        PendingIntent endCallPendingIntent = PendingIntent.getBroadcast(this, 0, endCallIntent,
                PendingIntent.FLAG_IMMUTABLE);

        // Use standard system icons as a fallback
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(android.R.drawable.sym_action_call)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .addAction(android.R.drawable.sym_action_call, "End Call", endCallPendingIntent)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void stopForegroundService() {
        stopForeground(true);
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Ongoing Call",
                    NotificationManager.IMPORTANCE_DEFAULT);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
} 