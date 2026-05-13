import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { theme } from '../../utils/theme';

export default function IssuesListScreen({ navigation }: any) {
  const [issues, setIssues] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    try { const { data } = await api.get('/api/issues'); setIssues(data.issues); }
    finally { setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Text style={s.title}>Issues</Text>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primaryLight} />}
        data={issues}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: theme.colors.muted, marginTop: 40 }}>No issues yet</Text>}
        renderItem={({ item }) => (
          <Pressable style={s.row} onPress={() => navigation.navigate('IssueDetail', { id: item.id })}>
            <Text style={s.rowTitle}>{item.title}</Text>
            <Text style={s.rowMeta}>📍 {item.location}</Text>
            <Text style={[s.badge, statusStyle(item.status)]}>{item.status}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
const statusStyle = (st: string) => ({
  PENDING:     { backgroundColor: '#3D2000', color: '#FCD34D' },
  ASSIGNED:    { backgroundColor: '#0C1E4A', color: '#93C5FD' },
  IN_PROGRESS: { backgroundColor: '#1A0A40', color: '#C4B5FD' },
  RESOLVED:    { backgroundColor: '#022C1A', color: '#34D399' },
  CLOSED:      { backgroundColor: '#1A1A2A', color: '#6B7280' },
}[st] as any);
const s = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, color: theme.colors.text, letterSpacing: -0.5 },
  row: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  rowTitle: { fontWeight: '700', color: theme.colors.text, fontSize: 15 },
  rowMeta: { color: theme.colors.muted, marginTop: 4, fontSize: 12 },
  badge: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '700', overflow: 'hidden' },
});
