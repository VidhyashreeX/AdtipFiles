import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error
    console.error('[VideoErrorBoundary] Video component error:', error);
    console.error('[VideoErrorBoundary] Error info:', errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default fallback UI
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-triangle" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Video Error</Text>
          <Text style={styles.errorMessage}>
            Something went wrong while loading the video
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Icon name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoErrorBoundary;
