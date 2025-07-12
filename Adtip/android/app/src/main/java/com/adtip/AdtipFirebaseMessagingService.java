package com.adtip;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

// Import MainActivity and R from the correct package
import com.adtip.app.adtip_app.MainActivity;
import com.adtip.app.adtip_app.R;

public class AdtipFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "AdtipFCMService";
    private static final String CALL_CHANNEL_ID = "adtip_call_channel";
    private static final String CALL_CHANNEL_NAME = "Incoming Calls";
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Log.d(TAG, "Firebase Messaging Service created");
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "FCM message received: " + remoteMessage.getData());
        
        Map<String, String> data = remoteMessage.getData();
        
        // Check if this is a call-related message
        if (data.containsKey("type")) {
            String messageType = data.get("type");
            
            if ("CALL_INITIATE".equals(messageType)) {
                handleIncomingCall(data);
            } else if ("CALL_ACCEPT".equals(messageType)) {
                handleCallAccept(data);
            } else if ("CALL_END".equals(messageType)) {
                handleCallEnd(data);
            }
        }
    }

    private void handleIncomingCall(Map<String, String> data) {
        String sessionId = data.get("sessionId");
        String callerName = data.get("callerName");
        String callType = data.get("callType");
        String meetingId = data.get("meetingId");
        String token = data.get("token");
        
        Log.d(TAG, "Handling incoming call from: " + callerName);
        
        // Trigger native call handling
        triggerNativeIncomingCall(sessionId, callerName, callType, meetingId, token);
        
        // Show full-screen notification as fallback
        showIncomingCallNotification(sessionId, callerName, callType);
    }

    private void handleCallAccept(Map<String, String> data) {
        String sessionId = data.get("sessionId");
        Log.d(TAG, "Call accepted: " + sessionId);
        
        // Cancel any ongoing call notifications
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null && sessionId != null) {
            notificationManager.cancel(sessionId.hashCode());
        }
    }

    private void handleCallEnd(Map<String, String> data) {
        String sessionId = data.get("sessionId");
        Log.d(TAG, "Call ended: " + sessionId);
        
        // Cancel any ongoing call notifications
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null && sessionId != null) {
            notificationManager.cancel(sessionId.hashCode());
        }
        
        // Send broadcast to stop ringing
        Intent intent = new Intent("com.adtip.CALL_DECLINE");
        intent.putExtra("sessionId", sessionId);
        sendBroadcast(intent);
    }

    private void triggerNativeIncomingCall(String sessionId, String callerName, String callType, String meetingId, String token) {
        Intent intent = new Intent("com.adtip.INCOMING_CALL");
        intent.putExtra("sessionId", sessionId);
        intent.putExtra("callerName", callerName);
        intent.putExtra("callType", callType);
        intent.putExtra("meetingId", meetingId);
        intent.putExtra("token", token);
        
        sendBroadcast(intent);
        Log.d(TAG, "Native incoming call broadcast sent");
    }

    private void showIncomingCallNotification(String sessionId, String callerName, String callType) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;
        
        // Create intents for answer and decline actions
        Intent answerIntent = new Intent("com.adtip.CALL_ANSWER");
        answerIntent.putExtra("sessionId", sessionId);
        PendingIntent answerPendingIntent = PendingIntent.getBroadcast(
            this, 
            sessionId.hashCode() + 1, 
            answerIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        Intent declineIntent = new Intent("com.adtip.CALL_DECLINE");
        declineIntent.putExtra("sessionId", sessionId);
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
            this, 
            sessionId.hashCode() + 2, 
            declineIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Create full-screen intent to open the app
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("sessionId", sessionId);
        fullScreenIntent.putExtra("isIncomingCall", true);
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this, 
            sessionId.hashCode(), 
            fullScreenIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Build notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Incoming " + callType + " call")
            .setContentText(callerName + " is calling...")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(R.mipmap.ic_launcher, "Decline", declinePendingIntent)
            .addAction(R.mipmap.ic_launcher, "Answer", answerPendingIntent);
        
        // Show notification
        notificationManager.notify(sessionId.hashCode(), builder.build());
        Log.d(TAG, "Full-screen call notification shown");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CALL_CHANNEL_ID,
                CALL_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for incoming calls");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel created");
            }
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM token: " + token);
        // TODO: Send token to your server
    }
}
