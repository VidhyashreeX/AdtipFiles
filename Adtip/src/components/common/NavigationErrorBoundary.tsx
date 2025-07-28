// src/components/common/NavigationErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { navigationRef } from '../../navigation/NavigationService';
import { Logger } from '../../utils/ProductionLogger';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error
    Logger.error('NavigationErrorBoundary', 'Navigation error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Try to reset navigation to a safe state
    this.resetNavigationToSafeState();
  }

  resetNavigationToSafeState = () => {
    try {
      if (navigationRef.isReady()) {
        // Reset to home screen or auth screen depending on current state
        const currentRoute = navigationRef.getCurrentRoute();
        
        if (currentRoute?.name === 'Auth' || currentRoute?.name === 'Guest') {
          // If we're in auth flow, stay there
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        } else {
          // Otherwise, go to main app home
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Home' } }],
          });
        }
      }
    } catch (resetError) {
      Logger.error('NavigationErrorBoundary', 'Failed to reset navigation:', resetError);
      
      // Last resort: show alert and let user restart app
      Alert.alert(
        'Navigation Error',
        'The app encountered a navigation error. Please restart the app.',
        [
          {
            text: 'Restart App',
            onPress: () => {
              // Force app restart by resetting to initial state
              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError} 
          />
        );
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>Navigation Error</Text>
            <Text style={styles.message}>
              Something went wrong with navigation. Don&#39;t worry, we can fix this!
            </Text>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={this.resetError}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={this.resetNavigationToSafeState}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Reset Navigation
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

export default NavigationErrorBoundary;
