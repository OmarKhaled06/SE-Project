import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../store/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import AppTabs from './AppTabs';
import IssueDetailScreen from '../screens/common/IssueDetailScreen';
import NewIssueScreen from '../screens/member/NewIssueScreen';
import { theme } from '../utils/theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.bg }}>
      <ActivityIndicator color={theme.colors.primaryLight} />
    </View>
  );
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="IssueDetail" component={IssueDetailScreen}
            options={{
              headerShown: true, title: 'Issue',
              headerStyle: { backgroundColor: theme.colors.card },
              headerTintColor: theme.colors.text,
              headerShadowVisible: false,
            }} />
          <Stack.Screen name="NewIssue" component={NewIssueScreen}
            options={{
              headerShown: true, title: 'New Issue',
              headerStyle: { backgroundColor: theme.colors.card },
              headerTintColor: theme.colors.text,
              headerShadowVisible: false,
            }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
