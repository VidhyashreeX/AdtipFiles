package com.adtip;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.util.Log;

import androidx.annotation.Nullable;

import java.io.IOException;

public class CallRingingService extends Service {
    private static final String TAG = "CallRingingService";
    
    public static final String ACTION_START_RINGING = "com.adtip.START_RINGING";
    public static final String ACTION_STOP_RINGING = "com.adtip.STOP_RINGING";
    
    public static final String EXTRA_CALLER_NAME = "caller_name";
    public static final String EXTRA_SESSION_ID = "session_id";
    
    private MediaPlayer ringtonePlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private boolean isRinging = false;
    
    // Vibration pattern: wait, vibrate, pause, vibrate, pause, vibrate
    private static final long[] VIBRATION_PATTERN = {0, 1000, 500, 1000, 500, 1000, 500, 1000};

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "CallRingingService created");
        
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        
        // Initialize wake lock
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "AdtipCall:RingingWakeLock"
            );
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        
        String action = intent.getAction();
        Log.d(TAG, "onStartCommand: " + action);
        
        if (ACTION_START_RINGING.equals(action)) {
            String callerName = intent.getStringExtra(EXTRA_CALLER_NAME);
            String sessionId = intent.getStringExtra(EXTRA_SESSION_ID);
            startRinging(callerName, sessionId);
        } else if (ACTION_STOP_RINGING.equals(action)) {
            stopRinging();
            stopSelf();
        }
        
        return START_NOT_STICKY;
    }

    private void startRinging(String callerName, String sessionId) {
        if (isRinging) {
            Log.d(TAG, "Already ringing, ignoring start request");
            return;
        }
        
        Log.d(TAG, "Starting ringing for: " + callerName);
        isRinging = true;
        
        // Acquire wake lock
        acquireWakeLock();
        
        // Start vibration
        startVibration();
        
        // Start ringtone
        startRingtone();
        
        // Auto-stop after 30 seconds
        new android.os.Handler().postDelayed(() -> {
            if (isRinging) {
                Log.d(TAG, "Auto-stopping ringing after timeout");
                stopRinging();
                stopSelf();
            }
        }, 30000);
    }

    private void startVibration() {
        if (vibrator == null || !vibrator.hasVibrator()) {
            Log.d(TAG, "No vibrator available");
            return;
        }
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                VibrationEffect effect = VibrationEffect.createWaveform(VIBRATION_PATTERN, 0);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
                vibrator.vibrate(effect, audioAttributes);
            } else {
                vibrator.vibrate(VIBRATION_PATTERN, 0);
            }
            Log.d(TAG, "Vibration started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start vibration", e);
        }
    }

    private void startRingtone() {
        try {
            if (ringtonePlayer != null) {
                ringtonePlayer.release();
            }
            
            // Check if device is in silent mode
            if (audioManager != null) {
                int ringerMode = audioManager.getRingerMode();
                if (ringerMode == AudioManager.RINGER_MODE_SILENT) {
                    Log.d(TAG, "Device in silent mode, skipping ringtone");
                    return;
                }
            }
            
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (ringtoneUri == null) {
                ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            
            ringtonePlayer = new MediaPlayer();
            ringtonePlayer.setDataSource(this, ringtoneUri);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
                ringtonePlayer.setAudioAttributes(audioAttributes);
            } else {
                ringtonePlayer.setAudioStreamType(AudioManager.STREAM_RING);
            }
            
            ringtonePlayer.setLooping(true);
            ringtonePlayer.setVolume(1.0f, 1.0f);
            
            ringtonePlayer.setOnPreparedListener(mp -> {
                mp.start();
                Log.d(TAG, "Ringtone started");
            });
            
            ringtonePlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "Ringtone error: " + what + ", " + extra);
                return false;
            });
            
            ringtonePlayer.prepareAsync();
            
        } catch (IOException e) {
            Log.e(TAG, "Failed to start ringtone", e);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error starting ringtone", e);
        }
    }

    private void stopRinging() {
        if (!isRinging) {
            return;
        }
        
        Log.d(TAG, "Stopping ringing");
        isRinging = false;
        
        // Stop vibration
        if (vibrator != null) {
            try {
                vibrator.cancel();
                Log.d(TAG, "Vibration stopped");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping vibration", e);
            }
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
        
        // Release wake lock
        releaseWakeLock();
    }

    private void acquireWakeLock() {
        try {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(35000); // 35 seconds timeout
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

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "CallRingingService destroyed");
        stopRinging();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Static helper methods for easy service control
    public static void startRinging(Context context, String callerName, String sessionId) {
        Intent intent = new Intent(context, CallRingingService.class);
        intent.setAction(ACTION_START_RINGING);
        intent.putExtra(EXTRA_CALLER_NAME, callerName);
        intent.putExtra(EXTRA_SESSION_ID, sessionId);
        context.startService(intent);
    }

    public static void stopRinging(Context context) {
        Intent intent = new Intent(context, CallRingingService.class);
        intent.setAction(ACTION_STOP_RINGING);
        context.startService(intent);
    }
}
