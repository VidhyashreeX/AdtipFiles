// app/components/common/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Menu, Search, Wallet, User } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showWallet?: boolean;
  showProfile?: boolean;
  searchPlaceholder?: string;
  walletAmount?: string;
  onMenuPress?: () => void;
  onSearchChange?: (text: string) => void;
  onWalletPress?: () => void;
  onProfilePress?: () => void;
}

export function Header({
  title,
  showSearch = true,
  showWallet = true,
  showProfile = true,
  searchPlaceholder = 'Search',
  walletAmount = '0.00',
  onMenuPress,
  onSearchChange,
  onWalletPress,
  onProfilePress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onMenuPress && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Menu size={24} color="#374151" />
          </TouchableOpacity>
        )}
        
        {title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        
        {showSearch && (
          <View style={[styles.searchContainer, title ? styles.smallSearch : styles.largeSearch]}>
            <Search size={18} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              onChangeText={onSearchChange}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}
        
        <View style={styles.rightButtons}>
          {showWallet && (
            <TouchableOpacity style={styles.walletButton} onPress={onWalletPress}>
              <Wallet size={20} color="#24d05a" />
              <Text style={styles.walletAmount}>₹ {walletAmount}</Text>
            </TouchableOpacity>
          )}
          
          {showProfile && (
            <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
              <User size={20} color="#374151" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
  },
  titleContainer: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#24d05a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallSearch: {
    flex: 1,
  },
  largeSearch: {
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  walletAmount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#24d05a',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});