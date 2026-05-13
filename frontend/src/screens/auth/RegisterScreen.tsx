import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../store/auth';
import { theme } from '../../utils/theme';
export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const onSubmit = async () => {
    setBusy(true);
    try { await register(f.email.trim(), f.password, f.fullName.trim(), f.phone.trim() || undefined); }
    catch (e: any) { Alert.alert('Sign up failed', e?.response?.data?.error ?? e.message); }
    finally { setBusy(false); }
  };
  return (
    <View style={s.c}>
      <Text style={s.title}>Create account</Text>
      <Text style={s.subtitle}>Join CampusCare today</Text>
      <TextInput style={s.input} placeholder="Full name" placeholderTextColor={theme.colors.muted}
        value={f.fullName} onChangeText={set('fullName')} />
      <TextInput style={s.input} placeholder="Email" placeholderTextColor={theme.colors.muted}
        autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={set('email')} />
      <TextInput style={s.input} placeholder="Phone (optional)" placeholderTextColor={theme.colors.muted}
        keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
      <TextInput style={s.input} placeholder="Password (min 6)" placeholderTextColor={theme.colors.muted}
        secureTextEntry value={f.password} onChangeText={set('password')} />
      <Pressable style={s.btn} onPress={onSubmit} disabled={busy}>
        <Text style={s.btnText}>{busy ? 'Creating...' : 'Create account'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>I have an account</Text>
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
