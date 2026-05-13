import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Image } from 'react-native';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import { useAuth } from '../../store/auth';
import { theme } from '../../utils/theme';

const STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function IssueDetailScreen({ route }: any) {
  const { id } = route.params;
  const { hasRole, user } = useAuth();
  const [issue, setIssue] = useState<any>(null);
  const [comment, setComment] = useState('');
  const isStaff = hasRole('MANAGER') || hasRole('WORKER') || hasRole('ADMIN');
  const isManager = hasRole('MANAGER') || hasRole('ADMIN');

  const load = async () => { const { data } = await api.get(`/api/issues/${id}`); setIssue(data.issue); };
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    try { await api.put(`/api/issues/${id}/status`, { status }); load(); }
    catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? e.message); }
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/api/issues/${id}/comments`, { body: comment.trim() });
    setComment(''); load();
  };

  const uploadCompletion = async () => {
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (r.canceled) return;
    const asset = r.assets[0];
    const form = new FormData();
    form.append('photo', { uri: asset.uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    form.append('kind', 'COMPLETION');
    await api.post(`/api/issues/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
  };

  if (!issue) return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  return (
    <ScrollView style={{ backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.title}>{issue.title}</Text>
      <Text style={s.meta}>📍 {issue.location} · {issue.priority} · {issue.category}</Text>
      <Text style={s.body}>{issue.description}</Text>
      <Text style={s.badge}>{issue.status}</Text>

      {issue.photos?.map((p: any) => (
        <Image key={p.id} source={{ uri: process.env.EXPO_PUBLIC_API_URL + p.url }}
          style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 12 }} />
      ))}

      {isStaff && (issue.assigneeId === user?.id || isManager) && (
        <View style={{ marginTop: 20 }}>
          <Text style={s.section}>Update status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STATUSES.map((st) => (
              <Pressable key={st} onPress={() => setStatus(st)}
                style={[s.statusBtn, st === issue.status && s.statusBtnActive]}>
                <Text style={[s.statusBtnText, st === issue.status && { color: '#fff' }]}>{st}</Text>
              </Pressable>
            ))}
          </View>
          {issue.assigneeId === user?.id && (
            <Pressable style={s.completionBtn} onPress={uploadCompletion}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>📸 Upload completion photo</Text>
            </Pressable>
          )}
        </View>
      )}

      <Text style={s.section}>Comments ({issue.comments?.length ?? 0})</Text>
      {issue.comments?.map((c: any) => (
        <View key={c.id} style={s.comment}>
          <Text style={{ fontWeight: '700', color: theme.colors.text }}>{c.author?.fullName}</Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 2 }}>{c.body}</Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <TextInput value={comment} onChangeText={setComment} placeholder="Add comment..."
          placeholderTextColor={theme.colors.muted}
          style={[s.input, { flex: 1, color: theme.colors.text }]} />
        <Pressable onPress={sendComment} style={s.send}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3 },
  meta: { color: theme.colors.muted, marginTop: 6, fontSize: 13 },
  body: { marginTop: 14, color: theme.colors.textSecondary, lineHeight: 22 },
  badge: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.colors.primary, color: '#fff', fontWeight: '700', overflow: 'hidden' },
  section: { fontWeight: '800', marginTop: 24, marginBottom: 10, color: theme.colors.text, fontSize: 15 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  statusBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  statusBtnText: { color: theme.colors.text, fontWeight: '600', fontSize: 12 },
  completionBtn: { marginTop: 12, padding: 14, borderRadius: 12, backgroundColor: theme.colors.success, alignItems: 'center' },
  comment: { padding: 12, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, marginTop: 8 },
  input: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 12 },
  send: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 12, marginLeft: 8, justifyContent: 'center' },
});
