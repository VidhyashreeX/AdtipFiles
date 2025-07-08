import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import CallController from '../services/calling/CallController';
import { CallType } from '../stores/callStoreSimplified';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainNavigatorParamList } from '../types/navigation';

const TestCallScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('Test User');
  const callController = CallController.getInstance();

  const handleCall = async (callType: CallType) => {
    if (!recipientId) {
      Alert.alert('Error', 'Please enter a recipient ID');
      return;
    }

    try {
      const success = await callController.startCall(
        recipientId,
        recipientName || 'Test User',
        callType
      );

      if (!success) {
        Alert.alert('Call Failed', 'Unable to start the call. The user may be unavailable.');
      }
    } catch (error) {
      console.error('[TestCallScreen] Call error:', error);
      Alert.alert('Error', 'Failed to start call. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Call Test Page</Text>
      
      <View style={styles.infoContainer}>
        <Text style={{ color: colors.text.secondary }}>Your user ID: {user?.id}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={{ color: colors.text.primary }}>Recipient ID:</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text.primary,
            borderColor: colors.border
          }]}
          value={recipientId}
          onChangeText={setRecipientId}
          placeholder="Enter recipient ID"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={{ color: colors.text.primary }}>Recipient Name:</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text.primary,
            borderColor: colors.border
          }]}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Enter recipient name"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => handleCall('voice')}
        >
          <Text style={styles.buttonText}>Voice Call</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.success }]}
          onPress={() => handleCall('video')}
        >
          <Text style={styles.buttonText}>Video Call</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.note, { color: colors.text.secondary }]}>
        Note: Make sure the recipient ID belongs to an existing user, and that user has the app installed and online.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TestCallScreen; 