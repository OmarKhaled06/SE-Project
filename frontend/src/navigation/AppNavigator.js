import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';

import { useAuth } from '../utils/AuthContext';
import { COLORS } from '../utils/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Community Member Screens
import MyIssuesScreen from '../screens/community/MyIssuesScreen';
import SubmitIssueScreen from '../screens/community/SubmitIssueScreen';
import IssueDetailScreen from '../screens/community/IssueDetailScreen';

// Manager Screens
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import ManagerIssueDetailScreen from '../screens/manager/ManagerIssueDetailScreen';
import WorkersScreen from '../screens/manager/WorkersScreen';

// Worker Screens
import { WorkerIssuesScreen, WorkerIssueWorkScreen } from '../screens/worker/WorkerScreens';

// Admin Screens
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

// Shared
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab icon helper ──────────────────────────────
const TabIcon = ({ icon, label, focused }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={{ fontSize: 10, color: focused ? COLORS.primary : COLORS.textLight, marginTop: 2, fontWeight: focused ? '700' : '400' }}>
      {label}
    </Text>
  </View>
);

// ── Community Member Tab Navigator ───────────────
function CommunityTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { height: 70, paddingBottom: 10, borderTopWidth: 1, borderTopColor: COLORS.border } }}>
      <Tab.Screen
        name="MyIssues"
        component={MyIssuesStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="My Issues" focused={focused} /> }}
      />
      <Tab.Screen
        name="SubmitTab"
        component={SubmitIssueScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="➕" label="Report" focused={focused} /> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function MyIssuesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyIssuesList" component={MyIssuesScreen} />
      <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
      <Stack.Screen name="SubmitIssue" component={SubmitIssueScreen} />
    </Stack.Navigator>
  );
}

// ── Facility Manager Tab Navigator ───────────────
function ManagerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { height: 70, paddingBottom: 10, borderTopWidth: 1, borderTopColor: COLORS.border } }}>
      <Tab.Screen
        name="Dashboard"
        component={ManagerStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Dashboard" focused={focused} /> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function ManagerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} />
      <Stack.Screen name="ManagerIssueDetail" component={ManagerIssueDetailScreen} />
      <Stack.Screen name="Workers" component={WorkersScreen} />
    </Stack.Navigator>
  );
}

// ── Worker Tab Navigator ─────────────────────────
function WorkerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { height: 70, paddingBottom: 10, borderTopWidth: 1, borderTopColor: COLORS.border } }}>
      <Tab.Screen
        name="WorkerIssues"
        component={WorkerStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔧" label="My Tasks" focused={focused} /> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function WorkerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkerIssuesList" component={WorkerIssuesScreen} />
      <Stack.Screen name="WorkerIssueWork" component={WorkerIssueWorkScreen} />
    </Stack.Navigator>
  );
}

// ── Admin Navigator ──────────────────────────────
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    </Stack.Navigator>
  );
}

// ── Auth Navigator ───────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Loading Screen ───────────────────────────────
function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
      <Text style={{ fontSize: 60, marginBottom: 16 }}>🏫</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>CampusCare</Text>
      <ActivityIndicator color={COLORS.secondary} style={{ marginTop: 24 }} size="large" />
    </View>
  );
}

// ── Root Navigator ───────────────────────────────
export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) return <SplashScreen />;

  const getRoleNavigator = () => {
    if (!user) return <AuthStack />;
    switch (role) {
      case 'MEMBER':  return <CommunityTabs />;
      case 'MANAGER': return <ManagerTabs />;
      case 'WORKER':  return <WorkerTabs />;
      case 'ADMIN':   return <AdminStack />;
      default: return <AuthStack />;
    }
  };

  return (
    <NavigationContainer>
      {getRoleNavigator()}
    </NavigationContainer>
  );
}
