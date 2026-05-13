import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import { theme } from '../../utils/theme';
const CATS = ['ELECTRICAL','PLUMBING','HVAC','CLEANING','FURNITURE','SAFETY','IT','OTHER'];
const PRIOS = ['LOW','MEDIUM','HIGH','URGENT'];
export default function NewIssueScreen({ navigation }: any) {
  const [f, setF] = useState({ title: '', description: '', location: '', category: 'OTHER', priority: 'MEDIUM' });
  const [photo, setPhoto] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const pickPhoto = async () => {
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0]);
  };
  const onSubmit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/api/issues', f);
      if (photo) {
        const form = new FormData();
        form.append('photo', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
        form.append('kind', 'REPORT');
        await api.post(`/api/issues/${data.issue.id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigation.replace('IssueDetail', { id: data.issue.id });
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? e.message); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} style={{ backgroundColor: theme.colors.bg }}>
      <Pressable style={s.photo} onPress={pickPhoto}>
        {photo ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
          : <Text style={{ color: theme.colors.muted, fontSize: 14 }}>📷  Add photo</Text>}
      </Pressable>
      <TextInput style={s.input} placeholder="Title" placeholderTextColor={theme.colors.muted}
        value={f.title} onChangeText={set('title')} />
      <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Description"
        placeholderTextColor={theme.colors.muted} multiline value={f.description} onChangeText={set('description')} />
      <TextInput style={s.input} placeholder="Location (Building, Floor, Room)"
        placeholderTextColor={theme.colors.muted} value={f.location} onChangeText={set('location')} />
      <Text style={s.label}>Category</Text>
      <View style={s.chips}>{CATS.map((c) => (
        <Pressable key={c} style={[s.chip, f.category === c && s.chipActive]} onPress={() => set('category')(c)}>
          <Text style={[s.chipText, f.category === c && s.chipTextActive]}>{c}</Text>
        </Pressable>))}</View>
      <Text style={s.label}>Priority</Text>
      <View style={s.chips}>{PRIOS.map((p) => (
        <Pressable key={p} style={[s.chip, f.priority === p && s.chipActive]} onPress={() => set('priority')(p)}>
          <Text style={[s.chipText, f.priority === p && s.chipTextActive]}>{p}</Text>
        </Pressable>))}</View>
      <Pressable style={s.btn} disabled={busy} onPress={onSubmit}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{busy ? 'Submitting...' : 'Submit issue'}</Text>
      </Pressable>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  photo: { height: 140, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', backgroundColor: theme.colors.card },
  input: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 14, borderRadius: 12, marginBottom: 10, color: theme.colors.text, fontSize: 15 },
  label: { fontWeight: '700', marginTop: 10, marginBottom: 10, color: theme.colors.text, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
  chipTextActive: { color: '#fff' },
  btn: { marginTop: 28, backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
});
