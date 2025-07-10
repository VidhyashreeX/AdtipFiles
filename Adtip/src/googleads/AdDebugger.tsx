import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { adTracker } from './AdTracker';
import { useAppOpenAd } from './AppOpenAdManager';

interface AdDebuggerProps {
  visible?: boolean;
}

const AdDebugger: React.FC<AdDebuggerProps> = ({ visible = __DEV__ }) => {
  const [metrics, setMetrics] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);
  const { adLoaded, showAd, forceLoadAd } = useAppOpenAd();

  useEffect(() => {
    if (!visible) return;

    const updateMetrics = () => {
      const allMetrics = {
        banner: adTracker.getAdMetrics('banner'),
        appOpen: adTracker.getAdMetrics('app_open'),
        rectangle: adTracker.getAdMetrics('rectangle'),
        interstitial: adTracker.getAdMetrics('interstitial'),
        rewarded: adTracker.getAdMetrics('rewarded'),
      };
      setMetrics(allMetrics);
      setEvents(adTracker.getEvents().slice(-10)); // Last 10 events
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [visible]);

  const testAppOpenAd = () => {
    if (adLoaded) {
      showAd(true);
    } else {
      Alert.alert('Ad Not Ready', 'App open ad is not loaded yet. Try loading first.');
    }
  };

  const forceLoadAppOpenAd = () => {
    forceLoadAd();
    Alert.alert('Loading...', 'Attempting to load app open ad');
  };

  const clearMetrics = () => {
    adTracker.clearEvents();
    setEvents([]);
    setMetrics({});
    Alert.alert('Cleared', 'All ad metrics have been cleared');
  };

  if (visible) return null; //change to !visible to show Ad Debugger

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Ad Debugger</Text>
      
      {/* App Open Ad Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Open Ad</Text>
        <Text style={styles.status}>
          Status: {adLoaded ? '✅ Loaded' : '⏳ Loading...'}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={testAppOpenAd}>
            <Text style={styles.buttonText}>Test Ad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={forceLoadAppOpenAd}>
            <Text style={styles.buttonText}>Force Load</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ad Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Ad Metrics</Text>
        <ScrollView style={styles.metricsContainer}>
          {Object.entries(metrics).map(([adType, metric]: [string, any]) => (
            <View key={adType} style={styles.metricRow}>
              <Text style={styles.metricTitle}>{adType.toUpperCase()}</Text>
              <Text style={styles.metricText}>
                Loaded: {metric.totalLoaded} | Failed: {metric.totalFailed}
              </Text>
              <Text style={styles.metricText}>
                Success Rate: {metric.loadSuccessRate}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Recent Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Recent Events</Text>
        <ScrollView style={styles.eventsContainer}>
          {events.map((event, index) => (
            <View key={index} style={styles.eventRow}>
              <Text style={styles.eventText}>
                {event.adType} - {event.eventType}
              </Text>
              <Text style={styles.eventTime}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
              {event.error && (
                <Text style={styles.errorText}>
                  Error: {event.error.code || event.error.message}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Clear Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearMetrics}>
        <Text style={styles.clearButtonText}>Clear Metrics</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    width: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    padding: 15,
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    flex: 0.48,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  metricsContainer: {
    maxHeight: 100,
  },
  metricRow: {
    marginBottom: 8,
  },
  metricTitle: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricText: {
    color: 'white',
    fontSize: 10,
  },
  eventsContainer: {
    maxHeight: 120,
  },
  eventRow: {
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  eventText: {
    color: 'white',
    fontSize: 10,
  },
  eventTime: {
    color: '#999',
    fontSize: 9,
  },
  errorText: {
    color: '#F44336',
    fontSize: 9,
  },
  clearButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AdDebugger;
