import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import { CloudflareUploadService } from '../services/CloudflareUploadService';

interface VideoUploadDebuggerProps {
  videoPath?: string;
  onDebugComplete?: (results: any) => void;
}

export const VideoUploadDebugger: React.FC<VideoUploadDebuggerProps> = ({
  videoPath,
  onDebugComplete
}) => {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const runDebugTests = async () => {
    if (!videoPath) {
      Alert.alert('Error', 'No video path provided');
      return;
    }

    setIsDebugging(true);
    setDebugResults(null);

    try {
      console.log('[VideoUploadDebugger] Starting debug tests for:', videoPath);

      const results: any = {
        videoPath,
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Basic file existence and stats
      console.log('[VideoUploadDebugger] Test 1: File existence and stats');
      try {
        const exists = await RNFS.exists(videoPath);
        const stats = exists ? await RNFS.stat(videoPath) : null;
        
        results.tests.fileStats = {
          success: true,
          exists,
          stats: stats ? {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            mtime: stats.mtime,
            ctime: stats.ctime
          } : null
        };
      } catch (error) {
        results.tests.fileStats = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 2: CloudflareUploadService file reading test
      console.log('[VideoUploadDebugger] Test 2: CloudflareUploadService file reading');
      try {
        const uploadService = new CloudflareUploadService();
        const readingTest = await uploadService.testFileReading(videoPath);
        results.tests.cloudflareReading = readingTest;
      } catch (error) {
        results.tests.cloudflareReading = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Direct fetch test
      console.log('[VideoUploadDebugger] Test 3: Direct fetch test');
      try {
        let normalizedPath = videoPath;
        if (!videoPath.startsWith('file://')) {
          normalizedPath = `file://${videoPath}`;
        }

        const response = await fetch(normalizedPath);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          results.tests.directFetch = {
            success: true,
            responseOk: true,
            dataSize: arrayBuffer.byteLength,
            headers: Object.fromEntries(response.headers.entries())
          };
        } else {
          results.tests.directFetch = {
            success: false,
            responseOk: false,
            status: response.status,
            statusText: response.statusText
          };
        }
      } catch (error) {
        results.tests.directFetch = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 4: RNFS base64 reading (only for smaller files)
      console.log('[VideoUploadDebugger] Test 4: RNFS base64 reading');
      try {
        const stats = await RNFS.stat(videoPath);
        if (stats.size < 5 * 1024 * 1024) { // Only test for files < 5MB
          const base64Data = await RNFS.readFile(videoPath, 'base64');
          results.tests.rnfsBase64 = {
            success: true,
            base64Length: base64Data.length,
            estimatedOriginalSize: (base64Data.length * 3) / 4
          };
        } else {
          results.tests.rnfsBase64 = {
            success: false,
            skipped: true,
            reason: 'File too large for base64 test (>5MB)'
          };
        }
      } catch (error) {
        results.tests.rnfsBase64 = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      console.log('[VideoUploadDebugger] Debug tests complete:', results);
      setDebugResults(results);
      
      if (onDebugComplete) {
        onDebugComplete(results);
      }

    } catch (error) {
      console.error('[VideoUploadDebugger] Debug tests failed:', error);
      Alert.alert('Debug Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsDebugging(false);
    }
  };

  const generateReport = () => {
    if (!debugResults) return 'No debug results available';

    let report = `=== VIDEO UPLOAD DEBUG REPORT ===\n`;
    report += `Video Path: ${debugResults.videoPath}\n`;
    report += `Timestamp: ${debugResults.timestamp}\n\n`;

    Object.entries(debugResults.tests).forEach(([testName, result]: [string, any]) => {
      report += `--- ${testName.toUpperCase()} ---\n`;
      if (result.success) {
        report += `✅ SUCCESS\n`;
        if (result.details) {
          report += `Details: ${JSON.stringify(result.details, null, 2)}\n`;
        }
      } else {
        report += `❌ FAILED\n`;
        if (result.error) {
          report += `Error: ${result.error}\n`;
        }
      }
      report += `\n`;
    });

    return report;
  };

  const copyReportToClipboard = () => {
    const report = generateReport();
    console.log('[VideoUploadDebugger] Debug Report:\n', report);
    Alert.alert('Debug Report', 'Report has been logged to console. Check your development console.');
  };

  if (!videoPath) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Video Upload Debugger</Text>
        <Text style={styles.error}>No video path provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Upload Debugger</Text>
      <Text style={styles.path}>Path: {videoPath}</Text>
      
      <TouchableOpacity
        style={[styles.button, isDebugging && styles.buttonDisabled]}
        onPress={runDebugTests}
        disabled={isDebugging}
      >
        <Text style={styles.buttonText}>
          {isDebugging ? 'Running Tests...' : 'Run Debug Tests'}
        </Text>
      </TouchableOpacity>

      {debugResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Debug Results:</Text>
          <ScrollView style={styles.resultsScroll}>
            {Object.entries(debugResults.tests).map(([testName, result]: [string, any]) => (
              <View key={testName} style={styles.testResult}>
                <Text style={styles.testName}>{testName}:</Text>
                <Text style={[styles.testStatus, result.success ? styles.success : styles.failure]}>
                  {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                </Text>
                {result.error && (
                  <Text style={styles.errorText}>Error: {result.error}</Text>
                )}
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.reportButton} onPress={copyReportToClipboard}>
            <Text style={styles.buttonText}>View Full Report (Console)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    margin: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  path: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultsScroll: {
    maxHeight: 200,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
  },
  testResult: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  testStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  success: {
    color: 'green',
  },
  failure: {
    color: 'red',
  },
  errorText: {
    fontSize: 10,
    color: 'red',
    marginTop: 2,
  },
  error: {
    color: 'red',
    fontStyle: 'italic',
  },
  reportButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
});

export default VideoUploadDebugger;
