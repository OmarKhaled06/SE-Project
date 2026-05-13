import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuth } from './src/store/auth';

export default function App() {
  const restore = useAuth((s) => s.restore);
  useEffect(() => { restore(); }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer><RootNavigator /></NavigationContainer>
    </SafeAreaProvider>
  );
}
