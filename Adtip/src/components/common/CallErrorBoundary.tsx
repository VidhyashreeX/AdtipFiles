import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import UnifiedCallService from '../../services/calling/UnifiedCallService';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class CallErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[CallErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[CallErrorBoundary] Component did catch:', error, errorInfo);
    
    // Log the error for debugging
    console.error('[CallErrorBoundary] Stack trace:', error.stack);
    console.error('[CallErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // End any active call to prevent further issues
    try {
      const unifiedCallService = UnifiedCallService.getInstance();
      unifiedCallService.endCall('Error boundary triggered');
    } catch (e) {
      console.error('[CallErrorBoundary] Error ending call:', e);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleEndCall = () => {
    try {
      const unifiedCallService = UnifiedCallService.getInstance();
      unifiedCallService.endCall('User ended call from error boundary');
    } catch (error) {
      console.error('[CallErrorBoundary] Error ending call:', error);
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertTriangle size={48} color="#EF4444" />
            <Text style={styles.title}>Call Error</Text>
            <Text style={styles.message}>
              Something went wrong with the call. This might be due to network issues or call configuration problems.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.endButton]}
                onPress={this.handleEndCall}
                activeOpacity={0.8}
              >
                <Text style={styles.endButtonText}>End Call</Text>
              </TouchableOpacity>
            </View>
            
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error?.message || 'Unknown error'}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#22C55E',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#EF4444',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default CallErrorBoundary;
