import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/auth';
import { theme } from '../../utils/theme';
export default function HomeScreen({ navigation }: any) {
  const { user, primaryRole } = useAuth();
  const role = primaryRole();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={s.greeting}>Good day,</Text>
        <Text style={s.name}>{user?.fullName}</Text>
        <View style={s.roleBadge}><Text style={s.roleText}>{role}</Text></View>

        {role === 'MEMBER' && (
          <Pressable style={s.cta} onPress={() => navigation.navigate('NewIssue')}>
            <Text style={s.ctaLabel}>NEW ISSUE</Text>
            <Text style={s.ctaTitle}>Report a problem</Text>
            <Text style={s.ctaSub}>Snap a photo, pick a category, done.</Text>
          </Pressable>
        )}

        <Pressable style={s.link} onPress={() => navigation.navigate('Issues')}>
          <Text style={s.linkText}>View all issues</Text>
          <Text style={s.linkArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  greeting: { fontSize: 15, color: theme.colors.muted, fontWeight: '500' },
  name: { fontSize: 30, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  roleText: { color: theme.colors.primaryLight, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  cta: { marginTop: 28, padding: 24, borderRadius: 20, backgroundColor: theme.colors.primary },
  ctaLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  ctaTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  ctaSub: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 14 },
  link: { marginTop: 14, padding: 18, backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { fontWeight: '600', color: theme.colors.text, fontSize: 15 },
  linkArrow: { color: theme.colors.primaryLight, fontSize: 18, fontWeight: '300' },
});
