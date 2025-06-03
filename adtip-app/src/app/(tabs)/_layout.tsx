import {Tabs} from 'expo-router';
import {StyleSheet, View} from 'react-native';
import {
  Chrome as Home,
  Video,
  Phone,
  ShoppingBag,
  Plus,
} from 'lucide-react-native';
import {BlurView} from 'expo-blur';
import {useColorScheme} from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#24d05a',
        tabBarInactiveTintColor: isDark ? '#AAAAAA' : '#777777',
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: 60,
          marginBottom: 16, // Added to move tab bar down by ~1 inch
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({color, size}) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tiptube"
        options={{
          title: 'Tip Tube',
          tabBarIcon: ({color, size}) => <Video color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="createContent"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <Plus color="white" size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tipcall"
        options={{
          title: 'Tip Call',
          tabBarIcon: ({color, size}) => <Phone color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tipshop"
        options={{
          title: 'Tip Shop',
          tabBarIcon: ({color, size}) => (
            <ShoppingBag color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});
