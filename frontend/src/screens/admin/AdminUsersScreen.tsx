import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { theme } from '../../utils/theme';
const ROLES = ['MEMBER','WORKER','MANAGER','ADMIN'];
export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const load = async () => { const { data } = await api.get('/api/admin/users'); setUsers(data.users); };
  useEffect(() => { load(); }, []);
  const toggleActive = async (u: any) => { await api.put(`/api/admin/users/${u.id}/status`, { active: !u.active }); load(); };
  const toggleRole = async (u: any, role: string) => {
    const on = !u.roles.find((r: any) => r.role === role);
    await api.put(`/api/admin/users/${u.id}/role`, { role, on }); load();
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Text style={s.title}>User Management</Text>
      <FlatList data={users} keyExtractor={(u) => u.id} contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: theme.colors.text, fontSize: 15 }}>{item.fullName}</Text>
                <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 2 }}>{item.email}</Text>
              </View>
              <Pressable onPress={() => toggleActive(item)}
                style={[s.statusPill, { backgroundColor: item.active ? '#022C1A' : '#2D0A0A', borderColor: item.active ? '#065F46' : '#7F1D1D' }]}>
                <Text style={{ fontWeight: '700', color: item.active ? '#34D399' : '#FF4757', fontSize: 11 }}>
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {ROLES.map((role) => {
                const on = item.roles.find((r: any) => r.role === role);
                return (
                  <Pressable key={role} onPress={() => toggleRole(item, role)}
                    style={[s.chip, on && s.chipActive]}>
                    <Text style={[s.chipText, on && { color: '#fff' }]}>{on ? '− ' : '+ '}{role}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )} />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, color: theme.colors.text, letterSpacing: -0.5 },
  row: { padding: 16, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, fontWeight: '700', color: theme.colors.text },
});
