import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { issuesAPI, CATEGORIES, PRIORITIES } from '../../services/api';
import { Button, Input } from '../../components/UI';
import { COLORS } from '../../utils/theme';

export default function SubmitIssueScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    priority: 'MEDIUM',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || form.title.trim().length < 3) {
      Alert.alert('Required', 'Please give the issue a short title (at least 3 characters).');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      Alert.alert('Required', 'Please describe the issue in at least 10 characters.');
      return;
    }
    if (!form.location.trim() || form.location.trim().length < 2) {
      Alert.alert('Required', 'Please specify a location.');
      return;
    }
    if (!form.category) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    setLoading(true);
    try {
      const res = await issuesAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        category: form.category,
        priority: form.priority,
      });
      const issueId = res.data.issue.id;

      if (photo) {
        const formData = new FormData();
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('photo', { uri: photo.uri, name: filename || 'photo.jpg', type });
        try { await issuesAPI.uploadPhoto(issueId, formData, 'REPORT'); } catch (e) {}
      }

      // Reset form, then either go back (if launched from MyIssues) or switch to MyIssues tab.
      setForm({ title: '', description: '', location: '', category: '', priority: 'MEDIUM' });
      setPhoto(null);
      Alert.alert('✅ Success', 'Your issue has been submitted successfully!', [
        {
          text: 'View My Issues',
          onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.getParent()?.navigate('MyIssues');
          },
        },
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit issue.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report an Issue</Text>
        </View>

        <View style={styles.form}>
          {/* Title */}
          <Input
            label="Title *"
            placeholder="e.g. Leaking sink in B-201"
            value={form.title}
            onChangeText={(v) => update('title', v)}
            maxLength={120}
          />

          {/* Photo */}
          <Text style={styles.sectionTitle}>📷 Photo (optional)</Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
              <TouchableOpacity onPress={() => setPhoto(null)} style={styles.removePhoto}>
                <Text style={styles.removePhotoText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                <Text style={styles.photoBtnText}>📸 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Text style={styles.photoBtnText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🏷 Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, form.category === cat.key && styles.catChipSelected]}
                onPress={() => update('category', cat.key)}
              >
                <Text style={[styles.catChipText, form.category === cat.key && styles.catChipTextSelected]}>
                  {cat.icon} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📝 Description *</Text>
          <Input
            placeholder="Describe the issue in detail (min. 10 characters)..."
            value={form.description}
            onChangeText={(v) => update('description', v)}
            multiline
            numberOfLines={4}
            style={{ marginBottom: 0 }}
            maxLength={2000}
          />

          {/* Location */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📍 Location *</Text>
          <Input
            placeholder="e.g. Building B, Room 201"
            value={form.location}
            onChangeText={(v) => update('location', v)}
            maxLength={200}
          />

          {/* Priority */}
          <Text style={[styles.sectionTitle, { marginTop: 4 }]}>⚡ Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.prioChip, form.priority === p && styles.prioChipSelected]}
                onPress={() => update('priority', p)}
              >
                <Text style={[styles.prioChipText, form.priority === p && styles.prioChipTextSelected]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Submit Issue"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#FFFFFF99', fontSize: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  form: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 20, alignItems: 'center',
  },
  photoBtnText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  photoPreview: { position: 'relative' },
  photoImg: { width: '100%', height: 200, borderRadius: 12 },
  removePhoto: {
    position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  removePhotoText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  catChipSelected: { borderColor: COLORS.primary, backgroundColor: '#EBF1FB' },
  catChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  catChipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  prioChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  prioChipSelected: { borderColor: COLORS.primary, backgroundColor: '#EBF1FB' },
  prioChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  prioChipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  submitBtn: { marginTop: 24 },
});
