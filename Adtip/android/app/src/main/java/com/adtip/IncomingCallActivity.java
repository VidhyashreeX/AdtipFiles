package com.adtip;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class IncomingCallActivity extends Activity {

    // Store view references as instance variables
    private TextView callerText;
    private TextView callTypeText;
    private Button answerButton;
    private Button declineButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Use a simple programmatic layout instead of R.layout reference
        createSimpleLayout();
        
        // Get call data from intent
        String callerName = getIntent().getStringExtra("callerName");
        String callType = getIntent().getStringExtra("callType");
        
        // Set up the UI programmatically since we don't have layout resources
        setupCallUI(callerName, callType);
    }
    
    private void createSimpleLayout() {
        // Create a simple layout programmatically to avoid R.layout dependency
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setPadding(50, 100, 50, 100);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(0xFF1a1a1a); // Dark background
        
        // Caller name text view
        callerText = new TextView(this);
        callerText.setId(android.view.View.generateViewId());
        callerText.setTextSize(28);
        callerText.setTextColor(0xFFFFFFFF); // White text
        callerText.setGravity(android.view.Gravity.CENTER);
        callerText.setPadding(0, 20, 0, 10);
        layout.addView(callerText);
        
        // Call type text view
        callTypeText = new TextView(this);
        callTypeText.setId(android.view.View.generateViewId());
        callTypeText.setTextSize(18);
        callTypeText.setTextColor(0xFFCCCCCC); // Light gray text
        callTypeText.setGravity(android.view.Gravity.CENTER);
        callTypeText.setPadding(0, 10, 0, 60);
        layout.addView(callTypeText);
        
        // Button container
        android.widget.LinearLayout buttonLayout = new android.widget.LinearLayout(this);
        buttonLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        buttonLayout.setGravity(android.view.Gravity.CENTER);
        
        // Decline button (Red - on the left)
        declineButton = new Button(this);
        declineButton.setId(android.view.View.generateViewId());
        declineButton.setText("Decline");
        declineButton.setBackgroundColor(0xFFE53E3E); // Red
        declineButton.setTextColor(0xFFFFFFFF); // White
        declineButton.setTextSize(16);
        declineButton.setPadding(50, 30, 50, 30);
        android.widget.LinearLayout.LayoutParams declineParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        declineParams.setMargins(30, 0, 30, 0);
        declineButton.setLayoutParams(declineParams);
        buttonLayout.addView(declineButton);
        
        // Answer button (Green - on the right)
        answerButton = new Button(this);
        answerButton.setId(android.view.View.generateViewId());
        answerButton.setText("Answer");
        answerButton.setBackgroundColor(0xFF4CAF50); // Green
        answerButton.setTextColor(0xFFFFFFFF); // White
        answerButton.setTextSize(16);
        answerButton.setPadding(50, 30, 50, 30);
        android.widget.LinearLayout.LayoutParams answerParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        answerParams.setMargins(30, 0, 30, 0);
        answerButton.setLayoutParams(answerParams);
        buttonLayout.addView(answerButton);
        
        layout.addView(buttonLayout);
        setContentView(layout);
    }
    
    private void setupCallUI(String callerName, String callType) {
        // Now we can use the instance variables directly
        if (callerText != null) {
            callerText.setText(callerName != null ? callerName : "Unknown Caller");
        }
        
        if (callTypeText != null) {
            callTypeText.setText(callType != null ? callType.toUpperCase() + " CALL" : "VOICE CALL");
        }
        
        if (answerButton != null) {
            answerButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    handleAnswer();
                }
            });
        }
        
        if (declineButton != null) {
            declineButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    handleDecline();
                }
            });
        }
    }
    
    private void handleAnswer() {
        Intent intent = new Intent("com.adtip.CALL_ACTION");
        intent.putExtra("action", "ANSWER");
        intent.putExtra("sessionId", getIntent().getStringExtra("sessionId"));
        sendBroadcast(intent);
        finish();
    }
    
    private void handleDecline() {
        Intent intent = new Intent("com.adtip.CALL_ACTION");
        intent.putExtra("action", "DECLINE");
        intent.putExtra("sessionId", getIntent().getStringExtra("sessionId"));
        sendBroadcast(intent);
        finish();
    }
    
    @Override
    public void onBackPressed() {
        // Prevent back button from closing the incoming call screen
        // User must either answer or decline
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Clean up any resources if needed
    }
}