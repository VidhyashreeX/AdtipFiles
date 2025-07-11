import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/common/Header';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const ChooseGameScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const nav = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Play to Earn"
        showWallet={false}
        showSearch={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => nav.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: typeof colors.primary === 'string' ? colors.primary : '#24d05a' }]}>Choose a Game</Text>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.primary, opacity: 0.5 }]}
        disabled
      >
        <Text style={[styles.cardText, { color: '#fff' }]}>🎲 Ludo Game (Coming Soon)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, opacity: 0.5 }]}
        disabled
      >
        <Text style={[styles.cardText, { color: typeof colors.text === 'string' ? colors.text : colors.text.primary }]}>♟️ Chess Game (Coming Soon)</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  card: {
    width: width * 0.8,
    paddingVertical: 32,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardText: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default ChooseGameScreen; 