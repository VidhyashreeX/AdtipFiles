// app/components/layout/SideMenu.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Chrome as Home, Search, Wallet, Users, Gamepad2, Play, BookOpen, Settings, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import { AppRoutes } from '../../_routes';

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SideMenu({ isVisible, onClose }: SideMenuProps) {
  const router = useRouter();
  
  if (!isVisible) return null;

  const handleNavigation = (route: AppRoutes) => {
    onClose();
    router.push(route);
  };
  
  const menuItems = [
    { icon: <Home size={24} color="#374151" />, label: 'Home', route: '/' },
    { icon: <Search size={24} color="#374151" />, label: 'Transformation', route: '/transformation' },
    { icon: <Search size={24} color="#374151" />, label: 'Explore', route: '/explore' },
    { icon: <Wallet size={24} color="#374151" />, label: 'Wallet', route: '/wallet' },
    { icon: <Users size={24} color="#374151" />, label: 'Refer', route: '/refer' },
    { icon: <Gamepad2 size={24} color="#374151" />, label: 'Play to earn', route: '/play-to-earn' },
    { icon: <Play size={24} color="#374151" />, label: 'Watch to earn', route: '/watch-to-earn' },
    { icon: <BookOpen size={24} color="#374151" />, label: 'My Ad passbook', route: '/ad-passbook' },
    { icon: <Search size={24} color="#374151" />, label: 'View profile', route: '/profile' },
    { icon: <Settings size={24} color="#374151" />, label: 'Settings', route: '/settings' },
    { icon: <HelpCircle size={24} color="#374151" />, label: 'Help', route: '/help' },
    { icon: <LogOut size={24} color="#374151" />, label: 'Log out', route: '/logout' },
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.menuContainer}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage} />
          </View>
          <Text style={styles.profileName}>Name</Text>
          <View style={styles.walletChip}>
            <Wallet size={16} color="#24d05a" />
            <Text style={styles.walletAmount}>₹ 10.56</Text>
          </View>
          <View style={styles.toggleContainer}>
            <View style={styles.toggle}>
              <View style={styles.toggleButton} />
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route as AppRoutes)}
            >
              {item.icon}
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.viewProfileButton}
          onPress={() => handleNavigation('/profile')}
        >
          <Text style={styles.viewProfileText}>View profile</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '100%',
    backgroundColor: 'white',
    zIndex: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e2e8f0',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 12,
  },
  walletAmount: {
    marginLeft: 4,
    color: '#24d05a',
    fontWeight: '600',
  },
  toggleContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  toggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    padding: 2,
    justifyContent: 'center',
  },
  toggleButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#24d05a',
    marginLeft: 'auto',
  },
  menuItems: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#374151',
  },
  viewProfileButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewProfileText: {
    color: '#24d05a',
    fontWeight: '500',
  },
});