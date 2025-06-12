package com.adtip.app.adtip_app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log; // Import Log

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map; // Import Map

public class CallNotificationService extends FirebaseMessagingService {
    private static final String CALL_CHANNEL_ID = "call_channel";
    private static final String TAG = "CallNotificationService"; // TAG for logging
    
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM Message Received: " + remoteMessage.getData()); // Log entire data payload
        
        Map<String, String> data = remoteMessage.getData();
        if (data.size() > 0) {
            String callType = data.get("call_type"); // Use new key "call_type"
            // Check if it's an audio or video call based on the new payload
            if ("video".equals(callType) || "audio".equals(callType)) {
                Log.d(TAG, "Call notification identified. Type: " + callType);
                sendCallNotification(data);
            } else {
                Log.d(TAG, "Not a call notification or unknown call_type: " + callType);
            }
        } else {
            Log.d(TAG, "FCM message does not contain data payload.");
        }
    }
    
    private void sendCallNotification(Map<String, String> data) {
        String callerAppUserId = data.get("caller_app_user_id"); // New key         // New key
        String channelName = data.get("channelName");
        String callType = data.get("call_type");               // New key ("audio" or "video")
        
        // Caller name might not be in the payload, handle gracefully
        String callerName = data.get("callerName"); // Keep trying to get it, but handle if null
        if (callerName == null || callerName.isEmpty()) {
            callerName = "Unknown Caller"; // Default if not provided
            Log.d(TAG, "callerName not found in payload, using default: " + callerName);
        }
        
        Log.d(TAG, "Preparing call notification with data: " +
                "callerAppUserId=" + callerAppUserId + ", " +
                "channelName=" + channelName + ", " +
                "callType=" + callType + ", " +
                "callerName=" + callerName);

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // Pass new fields to the intent
        intent.putExtra("callerId", callerAppUserId); // Map caller_app_user_id to callerId for JS consistency
        intent.putExtra("callerName", callerName);
        intent.putExtra("channelName", channelName);
        intent.putExtra("callType", callType); // Will be "audio" or "video"
        intent.putExtra("isIncomingCall", true);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            (int) System.currentTimeMillis(), // Use unique request code for each notification
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
}