package com.adtip.app.adtip_app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class CallNotificationService extends FirebaseMessagingService {
    private static final String CALL_CHANNEL_ID = "call_channel";
    
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        // Check if message contains data payload for a call
        if (remoteMessage.getData().size() > 0) {
            String callType = remoteMessage.getData().get("callType");
            if ("video-call".equals(callType) || "audio-call".equals(callType)) {
                // This is a call notification, create high priority notification
                sendCallNotification(remoteMessage);
            }
        }
    }
    
    private void sendCallNotification(RemoteMessage remoteMessage) {
        String callerId = remoteMessage.getData().get("callerId");
        String callerName = remoteMessage.getData().get("callerName");
        String channelName = remoteMessage.getData().get("channelName");
        String callType = remoteMessage.getData().get("callType");
        
        if (callerName == null) callerName = "Unknown";
        
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("callerId", callerId);
        intent.putExtra("callerName", callerName);
        intent.putExtra("channelName", channelName);
        intent.putExtra("callType", callType);
        intent.putExtra("isIncomingCall", true);
        
        // Create a pending intent that will open our app
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Get ringtone URI
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        
        // Create notification channel for Oreo and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CALL_CHANNEL_ID,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for incoming calls");
            channel.enableVibration(true);
            
            // Set the ringtone for this channel
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(defaultSoundUri, attributes);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
        
        // Build the notification
        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Incoming " + ("video-call".equals(callType) ? "Video" : "Voice") + " Call")
                .setContentText("From " + callerName)
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(pendingIntent, true) // This makes it a heads-up notification
                .setContentIntent(pendingIntent);
    
        NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        // Use a unique ID for each call notification
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, notificationBuilder.build());
    }
}