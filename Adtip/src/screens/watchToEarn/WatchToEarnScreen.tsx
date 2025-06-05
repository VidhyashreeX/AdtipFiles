import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';

const WatchToEarnScreen: React.FC = () => {
  const {colors} = useTheme();
  const {contentPaddingBottom} = useTabNavigator();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Watch to Earn" showBackButton />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingTop: 16, paddingBottom: contentPaddingBottom}}
      >
        <View style={styles.centerContent}>
          <Text style={[styles.title, {color: colors.text.primary}]}>
            Watch to Earn
          </Text>
          <Text style={[styles.subtitle, {color: colors.text.secondary}]}>
            Coming Soon! Earn rewards by watching videos and content.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default WatchToEarnScreen;
