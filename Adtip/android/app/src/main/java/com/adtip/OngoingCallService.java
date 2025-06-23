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
import android.net.Uri;
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

import java.util.Timer;
import java.util.TimerTask;

public class OngoingCallService extends Service {
    public static final String ACTION_START_FOREGROUND_SERVICE = "ACTION_START_FOREGROUND_SERVICE";
    public static final String ACTION_STOP_FOREGROUND_SERVICE = "ACTION_STOP_FOREGROUND_SERVICE";
    private static final String TAG = "OngoingCallService";
    private static final String CHANNEL_ID = "OngoingCallChannel";
    private static final int NOTIFICATION_ID = 1;

    public static final String ACTION_END_CALL = "com.adtip.END_CALL";
    public static final String ACTION_MUTE_CALL = "com.adtip.MUTE_CALL";
    private static final String ACTION_MUTE_CALL_ACTION = "MUTE_CALL_ACTION";

    private Timer timer;
    private long startTime;
    private boolean isMuted = false;

    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        OngoingCallService getService() {
            return OngoingCallService.this;
        }
    }

    private final BroadcastReceiver endCallReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null) {
                String action = intent.getAction();
                if (ACTION_END_CALL.equals(action)) {
                    stopSelf();
                    ReactApplicationContext reactContext = (ReactApplicationContext) getApplicationContext();
                    reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("EndCall", null);
                } else if (ACTION_MUTE_CALL.equals(action)) {
                    isMuted = !isMuted;
                    updateMuteState();
                }
            }
        }
    };

    private String callerName = "";
    private String callType = "";
    private String sessionId = "";
    private long callStartTime = 0;
    private android.os.Handler handler = new android.os.Handler();
    private Runnable updateNotificationRunnable;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        IntentFilter filter = new IntentFilter("END_CALL_ACTION");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(endCallReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(endCallReceiver, filter);
        }

        startTimer();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_START_FOREGROUND_SERVICE.equals(action)) {
                callerName = intent.getStringExtra("callerName");
                callType = intent.getStringExtra("callType");
                sessionId = intent.getStringExtra("sessionId");
                callStartTime = System.currentTimeMillis();
                showNotificationWithDuration();
                startUpdatingNotification();
            } else if (ACTION_STOP_FOREGROUND_SERVICE.equals(action)) {
                stopForegroundService();
            }
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopTimer();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    private void showNotificationWithDuration() {
        String title = "Ongoing " + (callType != null ? callType : "") + " call";
        String duration = getFormattedDuration();
        String text = "With: " + (callerName != null ? callerName : "") + (duration.isEmpty() ? "" : " • " + duration);

        Intent notificationIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("adtip://call"));
        notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent endCallIntent = new Intent(ACTION_END_CALL);
        PendingIntent endCallPendingIntent = PendingIntent.getBroadcast(this, 0, endCallIntent,
                PendingIntent.FLAG_IMMUTABLE);

        Intent muteCallIntent = new Intent(ACTION_MUTE_CALL);
        PendingIntent muteCallPendingIntent = PendingIntent.getBroadcast(this, 1, muteCallIntent,
                PendingIntent.FLAG_IMMUTABLE);

        int muteIcon = isMuted ? android.R.drawable.ic_lock_silent_mode : android.R.drawable.ic_lock_silent_mode_off;
        String muteText = isMuted ? "Unmute" : "Mute";

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(android.R.drawable.sym_action_call)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .addAction(muteIcon, muteText, muteCallPendingIntent)
                .addAction(android.R.drawable.sym_action_call, "End Call", endCallPendingIntent)
                .setOnlyAlertOnce(true)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void startUpdatingNotification() {
        updateNotificationRunnable = new Runnable() {
            @Override
            public void run() {
                showNotificationWithDuration();
                handler.postDelayed(this, 1000);
            }
        };
        handler.post(updateNotificationRunnable);
    }

    private void stopUpdatingNotification() {
        if (updateNotificationRunnable != null) {
            handler.removeCallbacks(updateNotificationRunnable);
        }
    }

    private String getFormattedDuration() {
        if (callStartTime == 0) return "";
        long elapsed = (System.currentTimeMillis() - callStartTime) / 1000;
        long mins = elapsed / 60;
        long secs = elapsed % 60;
        return String.format("%02d:%02d", mins, secs);
    }

    private void stopForegroundService() {
        stopUpdatingNotification();
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

    private void updateMuteState() {
        // Update notification to reflect mute state
        showNotificationWithDuration();
        // Send event to React Native
        try {
            ReactApplicationContext reactContext = (ReactApplicationContext) getApplicationContext();
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("MuteToggled", isMuted);
        } catch (Exception e) {
            // Safe-guard: log but do not crash
            e.printStackTrace();
        }
    }

    private void startTimer() {
        startTime = System.currentTimeMillis();
        timer = new Timer();
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                long elapsedTime = System.currentTimeMillis() - startTime;
                long seconds = elapsedTime / 1000;
                long minutes = seconds / 60;
                seconds = seconds % 60;
                String time = String.format(java.util.Locale.getDefault(), "%02d:%02d", minutes, seconds);
                updateNotification("Ongoing call: " + time);
            }
        }, 0, 1000);
    }

    private void stopTimer() {
        if (timer != null) {
            timer.cancel();
            timer = null;
        }
        try {
            unregisterReceiver(endCallReceiver);
        } catch (IllegalArgumentException e) {
            // Receiver not registered, ignore
        }
    }

    private void updateNotification(String text) {
        // Implementation of updateNotification method
    }
} 