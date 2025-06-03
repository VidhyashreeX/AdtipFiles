import {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {useRouter} from 'expo-router';
import {useUserStore} from '@/store/userStore';

export default function CreateChannelScreen() {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const router = useRouter();
  const {createChannel} = useUserStore();

  const validateForm = () => {
    let isValid = true;

    if (!channelName.trim()) {
      setNameError('Channel name is required');
      isValid = false;
    } else if (channelName.length < 3) {
      setNameError('Channel name must be at least 3 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };

  const handleCreateChannel = () => {
    if (validateForm()) {
      createChannel(channelName, description);
      router.push('/channel/me');
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Channel</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}>
        <View style={styles.formContent}>
          <Text style={styles.title}>Create your TipTube channel</Text>
          <Text style={styles.subtitle}>
            Start sharing your content and earn money through views and
            engagement
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Channel Name</Text>
            <TextInput
              style={styles.input}
              value={channelName}
              onChangeText={setChannelName}
              placeholder="Enter channel name"
              maxLength={50}
              onBlur={() => {
                if (channelName && channelName.length < 3) {
                  setNameError('Channel name must be at least 3 characters');
                }
              }}
            />
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell viewers about your channel"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              (!channelName || nameError) && styles.disabledButton,
            ]}
            onPress={handleCreateChannel}
            disabled={!channelName || !!nameError}>
            <Text style={styles.createButtonText}>Create Channel</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By creating a channel, you agree to TipTube's Terms of Service and
            Community Guidelines
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#24d05a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});
