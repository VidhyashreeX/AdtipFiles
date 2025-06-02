import { StyleSheet, Text, View, TouchableOpacity, Image, Platform, ViewStyle } from 'react-native';
import { User, Play, ChartBar as BarChart2, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';

interface HeaderProps {
  activeTab?: 'profile' | 'shorts' | 'analytics' | 'search';
}

export default function Header({ activeTab }: HeaderProps) {
  const { hasChannel } = useUserStore();

  const navigateToProfile = () => {
    if (hasChannel) {
      router.push('/channel/me');
    } else {
      router.push('/channel/create');
    }
  };

  const navigateToShorts = () => {
    router.push('/shorts');
  };

  const navigateToAnalytics = () => {
    router.push('/analytics');
  };

  const navigateToSearch = () => {
    router.push('/search');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnlOAv4A7EMx1oFmQ9mpCWcnVei-C8T61XgJKqzXkYhoj7cIwnEq9GJImmue-5CtLUMLk&usqp=CAU' }}
          style={styles.logoImage}
        />
        <Text style={styles.logoText}>TipTube</Text>
      </View>
      
      <View style={styles.iconsContainer}>
        <TouchableOpacity 
          style={[styles.iconButton, activeTab === 'profile' && styles.activeIconButton]}
          onPress={navigateToProfile}
        >
          <User 
            size={24} 
            color={activeTab === 'profile' ? '#24d05a' : '#333'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, activeTab === 'shorts' && styles.activeIconButton]}
          onPress={navigateToShorts}
        >
          <Play 
            size={24} 
            color={activeTab === 'shorts' ? '#24d05a' : '#333'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, activeTab === 'analytics' && styles.activeIconButton]}
          onPress={navigateToAnalytics}
        >
          <BarChart2 
            size={24} 
            color={activeTab === 'analytics' ? '#24d05a' : '#333'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconButton, activeTab === 'search' && styles.activeIconButton]}
          onPress={navigateToSearch}
        >
          <Search 
            size={24} 
            color={activeTab === 'search' ? '#24d05a' : '#000'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Define a type for web-specific styles (e.g., position: 'sticky')
interface WebViewStyle {
  position?: 'sticky' | 'fixed' | 'absolute' | 'relative' | 'static';
  top?: number;
  zIndex?: number;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    ...(Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
      },
    }) as ViewStyle & WebViewStyle),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24d05a',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 16,
    borderRadius: 20,
  },
  activeIconButton: {
    backgroundColor: '#E8F5E9',
  },
});