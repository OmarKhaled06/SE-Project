import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { theme } from '../../utils/theme';
export default function NotificationsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const { data } = await api.get('/api/notifications'); setItems(data.notifications); };
  const markAll = async () => { await api.put('/api/notifications/read-all'); load(); };
  useEffect(() => { load(); }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={s.title}>Alerts</Text>
        <Pressable onPress={markAll} style={s.markBtn}>
          <Text style={{ color: theme.colors.primaryLight, fontWeight: '700', fontSize: 13 }}>Mark all read</Text>
        </Pressable>
      </View>
      <FlatList data={items} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: theme.colors.muted, marginTop: 40 }}>No notifications</Text>}
        renderItem={({ item }) => (
          <View style={[s.row, !item.read && { borderColor: theme.colors.primary }]}>
            {!item.read && <View style={s.dot} />}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>{item.title}</Text>
            <Text style={{ color: theme.colors.muted, marginTop: 4, fontSize: 13 }}>{item.body}</Text>
          </View>
        )} />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  markBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  row: { padding: 14, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginBottom: 6 },
});
