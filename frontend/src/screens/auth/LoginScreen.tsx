import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../store/auth';
import { theme } from '../../utils/theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const onSubmit = async () => {
    setBusy(true);
    try { await login(email.trim(), password); }
    catch (e: any) { Alert.alert('Login failed', e?.response?.data?.error ?? e.message); }
    finally { setBusy(false); }
  };
  return (
    <View style={s.c}>
      <Text style={s.title}>Welcome back</Text>
      <Text style={s.subtitle}>Sign in to your account</Text>
      <TextInput style={s.input} placeholder="Email" placeholderTextColor={theme.colors.muted}
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor={theme.colors.muted}
        secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={s.btn} onPress={onSubmit} disabled={busy}>
        <Text style={s.btnText}>{busy ? 'Signing in...' : 'Sign in'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>Create an account</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, padding: 28, justifyContent: 'center', backgroundColor: theme.colors.bg },
  title: { fontSize: 32, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: theme.colors.muted, marginTop: 6, marginBottom: 32 },
  input: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 14, borderRadius: 12, marginBottom: 12, color: theme.colors.text, fontSize: 15 },
  btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: theme.colors.primaryLight, textAlign: 'center', marginTop: 20, fontWeight: '600' },
});
