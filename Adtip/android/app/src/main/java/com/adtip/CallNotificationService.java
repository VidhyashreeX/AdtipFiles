package com.adtip.app.adtip_app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.adtip.CallNotificationHelper;
import com.adtip.OngoingCallService;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class CallNotificationService extends FirebaseMessagingService {
    private static final String CALL_CHANNEL_ID = "call_channel";
    private static final String TAG = "CallNotificationService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM Message Received: " + remoteMessage.getData());

        Map<String, String> data = remoteMessage.getData();
        if (data.size() > 0) {
            String callType = data.get("call_type");
            if ("video".equals(callType) || "audio".equals(callType)) {
                Log.d(TAG, "Call notification identified. Type: " + callType);
                // 1. Broadcast to JS/CallKeep for native call experience
                triggerCallKeepIncomingCall(data);

                // 2. Start OngoingCallService for persistent call state
                String callerName = data.get("callerName") != null ? data.get("callerName") : "Unknown Caller";
                String sessionId = data.get("sessionId") != null ? data.get("sessionId") : "";
                Intent serviceIntent = new Intent(this, OngoingCallService.class);
                serviceIntent.putExtra("callerName", callerName);
                serviceIntent.putExtra("callType", callType);
                serviceIntent.putExtra("sessionId", sessionId);
                serviceIntent.setAction("ACTION_START_FOREGROUND_SERVICE");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent);
                } else {
                    startService(serviceIntent);
                }

                // 3. Show WhatsApp-style incoming call notification
                CallNotificationHelper.showIncomingCallNotification(this, callerName, callType, sessionId);

                // 4. Also send fallback notification (optional, can be removed if not needed)
                sendCallNotification(data);
            } else {
                Log.d(TAG, "Not a call notification or unknown call_type: " + callType);
            }
        } else {
            Log.d(TAG, "FCM message does not contain data payload.");
        }
    }

    private void sendCallNotification(Map<String, String> data) {
        String callerAppUserId = data.get("caller_app_user_id");
        String channelName = data.get("channelName");
        String callType = data.get("call_type");
        String callerName = data.get("callerName");
        if (callerName == null || callerName.isEmpty()) {
            callerName = "Unknown Caller";
            Log.d(TAG, "callerName not found in payload, using default: " + callerName);
        }
        Log.d(TAG, "Preparing call notification with data: " +
                "callerAppUserId=" + callerAppUserId + ", " +
                "channelName=" + channelName + ", " +
                "callType=" + callType + ", " +
                "callerName=" + callerName);

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("callerId", callerAppUserId);
        intent.putExtra("callerName", callerName);
        intent.putExtra("channelName", channelName);
        intent.putExtra("callType", callType);
        intent.putExtra("isIncomingCall", true);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            (int) System.currentTimeMillis(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CALL_CHANNEL_ID,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for incoming calls");
            channel.enableVibration(true);
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(defaultSoundUri, attributes);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }

        String notificationContentTitle = "Incoming " + ("video".equals(callType) ? "Video" : "Voice") + " Call";

        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher) // Ensure this icon exists
                .setContentTitle(notificationContentTitle)
                .setContentText("From " + callerName)
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            int notificationId = (int) System.currentTimeMillis();
            notificationManager.notify(notificationId, notificationBuilder.build());
            Log.d(TAG, "Call notification sent with ID: " + notificationId);
        } else {
            Log.e(TAG, "NotificationManager is null, cannot send notification.");
        }
    }

    /**
     * Broadcast to JS/CallKeep for native call experience
     */
    private void triggerCallKeepIncomingCall(Map<String, String> data) {
        try {
            Log.d(TAG, "Triggering CallKeep for incoming call");
            Intent callKeepIntent = new Intent();
            callKeepIntent.setAction("ADTIP_INCOMING_CALL_RECEIVED");
            callKeepIntent.putExtra("callerName", data.get("callerName") != null ? data.get("callerName") : "Unknown Caller");
            callKeepIntent.putExtra("callType", data.get("call_type"));
            callKeepIntent.putExtra("callerId", data.get("caller_app_user_id"));
            callKeepIntent.putExtra("channelName", data.get("channelName"));
            callKeepIntent.putExtra("meetingId", data.get("meetingId"));
            callKeepIntent.putExtra("token", data.get("token"));
            callKeepIntent.putExtra("isIncomingCall", true);
            LocalBroadcastManager.getInstance(this).sendBroadcast(callKeepIntent);
            Log.d(TAG, "CallKeep trigger broadcast sent successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error triggering CallKeep: " + e.getMessage(), e);
        }
    }
} 