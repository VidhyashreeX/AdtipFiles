// src/components/debug/PerformanceDebugger.tsx - Development performance debugging component

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import { useMemoryWarnings } from '../../utils/MemoryLeakDetector';

interface PerformanceDebuggerProps {
  visible: boolean;
  onClose: () => void;
}

const PerformanceDebugger: React.FC<PerformanceDebuggerProps> = ({ visible, onClose }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get performance optimization data
  const {
    metrics,
    warnings,
    getPerformanceReport,
    forceGarbageCollection,
    clearAllCaches,
    runImmediateOptimization,
  } = usePerformanceOptimization({
    enableMemoryTracking: true,
    enableImagePreloading: true,
    enableModulePreloading: true,
    enableStartupOptimization: true,
    componentName: 'PerformanceDebugger',
  });

  const { getStats } = useMemoryWarnings();

  // Auto refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh || !visible) return;

    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, visible]);

  const handleForceGC = () => {
    forceGarbageCollection();
    Alert.alert('Performance', 'Garbage collection forced');
  };

  const handleClearCaches = async () => {
    try {
      await clearAllCaches();
      Alert.alert('Performance', 'All caches cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear caches');
    }
  };

  const handleOptimizeNow = async () => {
    try {
      await runImmediateOptimization();
      Alert.alert('Performance', 'Optimization completed');
    } catch (error) {
      Alert.alert('Error', 'Optimization failed');
    }
  };

  const handleExportReport = () => {
    const report = getPerformanceReport();
    
    // In a real app, you might export this to a file or send to analytics
    console.log('Performance Report:', JSON.stringify(report, null, 2));
    Alert.alert(
      'Report Exported',
      'Performance report has been logged to console'
    );
  };

  const memoryStats = getStats();
  const performanceReport = getPerformanceReport();

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? '#4CAF50' : '#FF5722';
  };

  if (!__DEV__ || !visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Performance Debugger</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.button, styles.toggleButton]}
                onPress={() => setAutoRefresh(!autoRefresh)}
              >
                <Text style={styles.buttonText}>
                  {autoRefresh ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Startup Time</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: getStatusColor(metrics.startupTime, 3000, true) }
                  ]}>
                    {metrics.startupTime}ms
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Cache Hit Rate</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: getStatusColor(metrics.cacheHitRate, 0.7) }
                  ]}>
                    {(metrics.cacheHitRate * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Memory Warnings</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: getStatusColor(metrics.memoryWarnings, 3, true) }
                  ]}>
                    {metrics.memoryWarnings}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Component Count</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: getStatusColor(memoryStats.componentCount, 50, true) }
                  ]}>
                    {memoryStats.componentCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Memory Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Memory Statistics</Text>
              
              <View style={styles.statsContainer}>
                <Text style={styles.statItem}>
                  Components: {memoryStats.componentCount}
                </Text>
                <Text style={styles.statItem}>
                  Listeners: {memoryStats.listenerCount}
                </Text>
                <Text style={styles.statItem}>
                  Timers: {memoryStats.timerCount}
                </Text>
                <Text style={styles.statItem}>
                  Monitoring: {memoryStats.isMonitoring ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {/* Cache Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cache Performance</Text>
              
              <View style={styles.statsContainer}>
                <Text style={styles.statItem}>
                  Cache Entries: {performanceReport.cache.cacheEntries}
                </Text>
                <Text style={styles.statItem}>
                  Cache Hits: {performanceReport.cache.cacheHits}
                </Text>
                <Text style={styles.statItem}>
                  Cache Misses: {performanceReport.cache.cacheMisses}
                </Text>
                <Text style={styles.statItem}>
                  Hit Rate: {(performanceReport.cache.hitRate * 100).toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Module Loading */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Module Loading</Text>
              
              <View style={styles.statsContainer}>
                <Text style={styles.statItem}>
                  Total Modules: {performanceReport.modules.totalModules}
                </Text>
                <Text style={styles.statItem}>
                  Loaded: {performanceReport.modules.loadedModules}
                </Text>
                <Text style={styles.statItem}>
                  Loading: {performanceReport.modules.loadingModules}
                </Text>
                <Text style={styles.statItem}>
                  Avg Load Time: {performanceReport.modules.averageLoadTime}ms
                </Text>
              </View>
            </View>

            {/* Memory Warnings */}
            {warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Memory Warnings</Text>
                
                {warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <Text style={styles.warningType}>{warning.type}</Text>
                    <Text style={styles.warningMessage}>{warning.message}</Text>
                    <Text style={styles.warningCount}>
                      Count: {warning.count} / Threshold: {warning.threshold}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleForceGC}>
                  <Text style={styles.actionButtonText}>Force GC</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleClearCaches}>
                  <Text style={styles.actionButtonText}>Clear Caches</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleOptimizeNow}>
                  <Text style={styles.actionButtonText}>Optimize Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleExportReport}>
                  <Text style={styles.actionButtonText}>Export Report</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Refresh Info */}
            <View style={styles.section}>
              <Text style={styles.refreshInfo}>
                Last refresh: {new Date().toLocaleTimeString()}
                {autoRefresh && ' (Auto)'}
              </Text>
              <Text style={styles.refreshInfo}>
                Refresh count: {refreshCount}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: Math.min(width * 0.9, 400),
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  toggleButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  statItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  warningItem: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  warningType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
  },
  warningMessage: {
    fontSize: 13,
    color: '#664d03',
    marginVertical: 2,
  },
  warningCount: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default PerformanceDebugger;