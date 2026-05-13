import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/common/HomeScreen';
import IssuesListScreen from '../screens/common/IssuesListScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import { useAuth } from '../store/auth';
import { theme } from '../utils/theme';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const isAdmin = useAuth((s) => s.hasRole('ADMIN'));
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: theme.colors.primaryLight,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.colors.card,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tab.Screen name="Issues" component={IssuesListScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} /> }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} /> }} />
      {isAdmin ? (
        <Tab.Screen name="Users" component={AdminUsersScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
      ) : (
        <Tab.Screen name="Profile" component={ProfileScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
      )}
    </Tab.Navigator>
  );
}
