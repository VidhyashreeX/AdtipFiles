package com.adtip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class CallActionReceiver extends BroadcastReceiver {
    private static final String TAG = "CallActionReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.adtip.CALL_ACTION".equals(intent.getAction())) {
            String action = intent.getStringExtra("action");
            String sessionId = intent.getStringExtra("sessionId");
            
            Log.d(TAG, "Received call action: " + action + " for session: " + sessionId);
            
            // Forward the action to the IncomingCallModule via another broadcast
            Intent forwardIntent = new Intent("com.adtip.CALL_ACTION_INTERNAL");
            forwardIntent.putExtra("action", action);
            forwardIntent.putExtra("sessionId", sessionId);
            context.sendBroadcast(forwardIntent);
        }
    }
}