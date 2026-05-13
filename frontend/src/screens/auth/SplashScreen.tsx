import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../utils/theme';
export default function SplashScreen({ navigation }: any) {
  return (
    <View style={s.c}>
      <Text style={s.logo}>⬡</Text>
      <Text style={s.title}>CampusCare</Text>
      <Text style={s.subtitle}>Report. Track. Resolve.</Text>
      <Pressable style={s.btnPrimary} onPress={() => navigation.navigate('Register')}>
        <Text style={s.btnPrimaryText}>Get started</Text>
      </Pressable>
      <Pressable style={s.btnSecondary} onPress={() => navigation.navigate('Login')}>
        <Text style={s.btnSecondaryText}>I have an account</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: theme.colors.bg },
  logo: { fontSize: 48, textAlign: 'center', color: theme.colors.primaryLight, marginBottom: 16 },
  title: { fontSize: 42, fontWeight: '800', color: theme.colors.text, textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: theme.colors.muted, marginTop: 8, marginBottom: 56, textAlign: 'center' },
  btnPrimary: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  btnSecondaryText: { color: theme.colors.text, fontWeight: '600', fontSize: 16 },
});
