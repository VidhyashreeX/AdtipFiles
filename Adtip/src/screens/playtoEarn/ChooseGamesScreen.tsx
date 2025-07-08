import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const ChooseGameScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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