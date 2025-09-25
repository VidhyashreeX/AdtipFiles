// src/components/common/ErrorBoundary.tsx - Enhanced error boundary with UI recovery

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableDevelopmentMode?: boolean;
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatErrorForDisplay = (error: Error): string => {
  let errorString = `${error.name}: ${error.message}`;
  
  if (error.stack) {
    // Clean up stack trace for better readability
    const stackLines = error.stack.split('\n').slice(0, 10); // Limit to first 10 lines
    errorString += '\n\nStack Trace:\n' + stackLines.join('\n');
  }
  
  return errorString;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to crash reporting service
    this.logError(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: 'React Native App',
      // Add more context as needed
    };

    // In a real app, send this to your error reporting service
    console.error('ErrorBoundary caught an error:', errorData);
    
    // Example: Send to analytics or crash reporting
    // Analytics.logError(errorData);
    // CrashReporting.recordError(error);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error && errorInfo) {
      const errorReport = {
        errorId,
        error: formatErrorForDisplay(error),
        errorInfo: JSON.stringify(errorInfo, null, 2),
        timestamp: new Date().toISOString(),
      };

      // In a real app, send this to support or bug tracking system
      console.log('Error report generated:', errorReport);
      
      // Example: Open email client or in-app feedback
      // Linking.openURL(`mailto:support@app.com?subject=Error Report - ${errorId}&body=${encodeURIComponent(JSON.stringify(errorReport, null, 2))}`);
    }
  };

  render() {
    const { 
      children, 
      fallback, 
      enableDevelopmentMode = __DEV__, 
      showErrorDetails = __DEV__ 
    } = this.props;
    
    const { hasError, error, errorInfo } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleRetry);
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color="#EF4444" />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            {/* Error Description */}
            <Text style={styles.description}>
              We apologize for the inconvenience. The app encountered an unexpected error.
            </Text>

            {/* Error ID */}
            <View style={styles.errorIdContainer}>
              <Text style={styles.errorIdLabel}>Error ID:</Text>
              <Text style={styles.errorId}>{this.state.errorId}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleReportError}
                activeOpacity={0.8}
              >
                <Bug size={20} color="#6B7280" />
                <Text style={styles.secondaryButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>

            {/* Error Details (Development Mode) */}
            {enableDevelopmentMode && showErrorDetails && error && (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>Error Details (Debug Mode)</Text>
                <ScrollView 
                  style={styles.errorDetailsScroll}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.errorDetailsText}>
                    {formatErrorForDisplay(error)}
                  </Text>
                  
                  {errorInfo && (
                    <>
                      <Text style={styles.errorDetailsSubtitle}>Component Stack:</Text>
                      <Text style={styles.errorDetailsText}>
                        {errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                If this problem persists, please contact our support team.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  errorIdLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  errorId: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#1BD4AA',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorDetailsContainer: {
    width: '100%',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  errorDetailsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDetailsScroll: {
    maxHeight: 200,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ErrorBoundary;