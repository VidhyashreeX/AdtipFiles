import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {
  Chrome as Home,
  Video,
  Phone,
  ShoppingBag,
  Plus,
} from 'lucide-react-native';
import {usePathname, useRouter} from 'expo-router';

interface TabBarProps {
  onPlusPress: () => void;
}

export function TabBar({onPlusPress}: TabBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {name: 'Home', icon: Home, route: '/'},
    {name: 'Tip Tube', icon: Video, route: '/tiptube'},
    {name: 'Create', icon: Plus, route: null, special: true},
    {name: 'Tip Call', icon: Phone, route: '/tipcall'},
    {name: 'Tip Shop', icon: ShoppingBag, route: '/tipshop'},
  ];

  const handlePress = (tab: (typeof tabs)[0]) => {
    if (tab.special) {
      onPlusPress();
    } else if (tab.route) {
      router.push(tab.route);
    }
  };

  const isActive = (route: string | null) => {
    if (!route) {
      return false;
    }
    return pathname === route;
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tab, tab.special && styles.specialTab]}
          onPress={() => handlePress(tab)}>
          {tab.special ? (
            <View style={styles.plusContainer}>
              <tab.icon size={24} color="white" />
            </View>
          ) : (
            <>
              <tab.icon
                size={24}
                color={isActive(tab.route) ? '#24d05a' : '#64748b'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive(tab.route) && styles.activeTabLabel,
                ]}>
                {tab.name}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#64748b',
  },
  activeTabLabel: {
    color: '#24d05a',
    fontWeight: '500',
  },
  specialTab: {
    justifyContent: 'center',
  },
  plusContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
    shadowColor: '#24d05a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
