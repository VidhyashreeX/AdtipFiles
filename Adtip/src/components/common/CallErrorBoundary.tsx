import React, { Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import UnifiedCallService from '../../services/calling/UnifiedCallService';
import CallMediaManager from '../../services/calling/CallMediaManager';
import { useCallStore } from '../../stores/callStore';
import { useNavigation } from '@react-navigation/native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
  isRecovering: boolean;
}

class CallErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: '',
      isRecovering: false 
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = error?.message || 'Unknown error';
    const componentStack = errorInfo?.componentStack || 'No component stack available';
    
    console.error('[CallErrorBoundary] Error caught:', error);
    console.error('[CallErrorBoundary] Component stack:', componentStack);
    
    // Check if this is a participant-related error
    const isParticipantError = errorMessage.includes('participant') || 
                             errorMessage.includes('displayName') ||
                             errorMessage.includes('undefined');
                             
    // Analyze error details to improve future debugging
    let errorCategory = 'unknown';
    
    if (errorMessage.includes('displayName')) {
      errorCategory = 'displayName_access';
    } else if (errorMessage.includes('undefined')) {
      errorCategory = 'undefined_object';
    } else if (errorMessage.includes('null')) {
      errorCategory = 'null_object';
    } else if (errorMessage.includes('participant')) {
      errorCategory = 'participant_error';
    }
    
    // Log error with category
    console.error(`[CallErrorBoundary] Error category: ${errorCategory}`);
    
    // Store error details in state
    this.setState({
      hasError: true,
      error,
      errorInfo: `${errorMessage}\n\n${componentStack}`,
      isRecovering: isParticipantError // Auto-recover for participant errors
    });
    
    // Attempt to recover automatically for participant-related errors
    if (isParticipantError) {
      console.log('[CallErrorBoundary] Participant-related error detected. Attempting auto-recovery...');
      this.attemptRecovery();
    }
  }
  
  // Attempt to recover from errors
  attemptRecovery = () => {
    if (this.state.isRecovering) {
      return; // Already attempting recovery
    }
    
    this.setState({ isRecovering: true });
    
    // For participant-related errors, try to get call state and clean up
    try {
      // First try to clean media manager since it's often the source of these issues
      CallMediaManager.forceCleanupIfNeeded();
      
      // For displayName errors specifically, clear the error immediately
      // since these are usually transient UI rendering issues
      if (this.state.error?.message?.includes('displayName')) {
        console.log('[CallErrorBoundary] DisplayName error detected, performing immediate recovery');
        this.setState({ 
          hasError: false,
          isRecovering: false,
          error: null,
          errorInfo: ''
        });
        return;
      }
      
      // Wait a moment and then reset the error state for other errors
      setTimeout(() => {
        if (this.state.hasError) {
          this.setState({ 
            hasError: false,
            isRecovering: false,
            error: null,
            errorInfo: ''
          });
        }
      }, 2000);
    } catch (recoveryError) {
      console.error('[CallErrorBoundary] Error during recovery attempt:', recoveryError);
      this.setState({ isRecovering: false });
    }
  }

  // Handle manual recovery attempt
  handleRetry = () => {
    this.attemptRecovery();
  }

  // End the call and navigate back
  handleEndCall = () => {
    try {
      // Use UnifiedCallService to properly end the call
      const callService = UnifiedCallService.getInstance();
      callService.endCall('error_boundary');
      
      // Clear error state
      this.setState({ 
        hasError: false,
        error: null,
        errorInfo: '',
        isRecovering: false 
      });
      
      // We don't need to navigate manually, the call status change observer will handle it
    } catch (error) {
      console.error('[CallErrorBoundary] Error ending call:', error);
      Alert.alert(
        'Error',
        'Failed to end the call properly. The app may need to be restarted.',
        [{ text: 'OK' }]
      );
    }
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const isParticipantError = errorMessage.includes('participant') || 
                               errorMessage.includes('displayName') ||
                               errorMessage.includes('undefined');
                               
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Call Error Detected</Text>
          
          {this.state.isRecovering ? (
            <>
              <Text style={styles.message}>
                Attempting to recover from error...
              </Text>
              <View style={styles.spinnerContainer}>
                {/* Simple text-based spinner */}
                <Text style={styles.spinner}>⟳</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.message}>
                {isParticipantError 
                  ? 'There was a problem with a call participant. This can happen when participants disconnect unexpectedly.' 
                  : 'Something went wrong with your call.'}
              </Text>
              
              {__DEV__ && (
                <Text style={styles.devError}>
                  {errorMessage}
                </Text>
              )}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.retryButton]} 
                  onPress={this.handleRetry}
                >
                  <Text style={styles.buttonText}>Try to Recover</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.endButton]} 
                  onPress={this.handleEndCall}
                >
                  <Text style={styles.buttonText}>End Call</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FF4343',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  devError: {
    color: '#FF9800',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#444444',
    marginRight: 10,
  },
  endButton: {
    backgroundColor: '#FF4343',
    marginLeft: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  spinnerContainer: {
    marginTop: 20,
  },
  spinner: {
    fontSize: 40,
    color: '#FFFFFF',
    // Add animation via a CSS animation
  },
});

export default CallErrorBoundary;
