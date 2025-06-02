// src/components/home/EarnCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

interface EarnCardProps {
  title: string;
  description: string;
  iconName: string;
  onPress: () => void;
}

const EarnCard: React.FC<EarnCardProps> = ({ 
  title, 
  description, 
  iconName, 
  onPress 
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.white,
          shadowColor: colors.black 
        }
      ]} 
      onPress={onPress}
    >
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
        </View>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
          <Icon name={iconName} size={24} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EarnCard;
