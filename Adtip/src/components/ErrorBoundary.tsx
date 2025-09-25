/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and provides fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import ErrorHandlingService from '../services/ErrorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary] Caught an error:', error);
    console.error('🚨 [ErrorBoundary] Error Info:', errorInfo);

    this.setState({ errorInfo });

    // Log the error using our error handling service
    try {
      await ErrorHandlingService.logError(error, {
        screen: 'ErrorBoundary',
        action: 'component_crash',
        additionalData: {
          errorInfo,
          componentStack: errorInfo.componentStack,
        },
      });
    } catch (loggingError) {
      console.error('Failed to log error to ErrorHandlingService:', loggingError);
    }

    // Call custom onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  showErrorDetails = () => {
    if (!this.state.error) return;

    const errorDetails = `
Error: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo?.componentStack || 'Not available'}
Time: ${new Date().toLocaleString()}
    `.trim();

    Alert.alert(
      'Error Details',
      errorDetails,
      [
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            // In a real app, you might use Clipboard.setString here
            console.log('Error details copied to clipboard');
          },
        },
        { text: 'OK' },
      ]
    );
  };

  sendErrorReport = async () => {
    try {
      Alert.alert(
        'Send Error Report',
        'Would you like to send an error report to help us fix this issue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Report',
            onPress: async () => {
              try {
                // Here you could send the error to your error reporting service
                const errorReport = {
                  error: this.state.error?.message,
                  stack: this.state.error?.stack,
                  componentStack: this.state.errorInfo?.componentStack,
                  timestamp: new Date().toISOString(),
                  userAgent: 'React Native App',
                };

                console.log('Error report would be sent:', errorReport);
                
                Alert.alert('Report Sent', 'Thank you for helping us improve the app!');
              } catch (reportError) {
                Alert.alert('Report Failed', 'Could not send error report. Please try again later.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending report:', error);
    }
  };

  renderFallbackUI = () => {
    if (this.props.fallback && this.state.error) {
      return this.props.fallback(this.state.error, this.resetError);
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          
          <Text style={styles.message}>
            The app encountered an unexpected error. Don't worry, this has been reported and we'll fix it soon.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={this.resetError}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={this.showErrorDetails}>
              <Text style={styles.secondaryButtonText}>Show Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={this.sendErrorReport}>
              <Text style={styles.secondaryButtonText}>Send Report</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Information:</Text>
              <Text style={styles.debugText}>{this.state.error.message}</Text>
              {this.state.error.stack && (
                <Text style={styles.debugStack}>{this.state.error.stack}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 8,
  },
  debugStack: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;