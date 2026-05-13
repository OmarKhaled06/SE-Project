import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/auth';
import { theme } from '../../utils/theme';
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 24 }}>
      <View style={s.avatarWrap}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
      <Text style={s.name}>{user?.fullName}</Text>
      <Text style={s.email}>{user?.email}</Text>
      <View style={s.rolesWrap}>
        {user?.roles?.map((r: any) => (
          <View key={r} style={s.rolePill}>
            <Text style={s.rolePillText}>{r}</Text>
          </View>
        ))}
      </View>
      <View style={s.divider} />
      <Pressable style={s.btn} onPress={logout}>
        <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 15 }}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name: { fontSize: 26, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3 },
  email: { color: theme.colors.muted, marginTop: 4, fontSize: 14 },
  rolesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  rolePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  rolePillText: { color: theme.colors.primaryLight, fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 28 },
  btn: { padding: 16, borderRadius: 14, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
});
