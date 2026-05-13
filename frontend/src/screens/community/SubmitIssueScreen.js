import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { issuesAPI, categoriesAPI } from '../../services/api';
import { Button, Input } from '../../components/UI';
import { COLORS } from '../../utils/theme';

export default function SubmitIssueScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    building_name: '', room_number: '', floor: ''
  });
  const [photo, setPhoto] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.7
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
      allowsEditing: true, quality: 0.7
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      Alert.alert('Required', 'Please describe the issue.');
      return;
    }
    if (!form.category_id) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('description', form.description);
      formData.append('category_id', form.category_id);
      if (form.title) formData.append('title', form.title);
      if (form.building_name) formData.append('building_name', form.building_name);
      if (form.room_number) formData.append('room_number', form.room_number);
      if (form.floor) formData.append('floor', form.floor);

      if (photo) {
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('photo', { uri: photo.uri, name: filename, type });
      }

      await issuesAPI.create(formData);
      Alert.alert('✅ Success', 'Your issue has been submitted successfully!', [
        { text: 'View My Issues', onPress: () => navigation.navigate('MyIssues') }
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report an Issue</Text>
        </View>

        <View style={styles.form}>
          {/* Photo */}
          <Text style={styles.sectionTitle}>📷 Photo</Text>
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
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, form.category_id === cat.id && styles.catChipSelected]}
                onPress={() => update('category_id', cat.id)}
              >
                <Text style={[styles.catChipText, form.category_id === cat.id && styles.catChipTextSelected]}>
                  {cat.category_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📝 Description *</Text>
          <Input
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChangeText={v => update('description', v)}
            multiline
            numberOfLines={4}
            style={{ marginBottom: 0 }}
          />

          {/* Location */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📍 Location</Text>
          <Input
            label="Building Name"
            placeholder="e.g., Building A, Main Hall"
            value={form.building_name}
            onChangeText={v => update('building_name', v)}
          />
          <View style={styles.row}>
            <Input
              label="Room / Area"
              placeholder="Room 201"
              value={form.room_number}
              onChangeText={v => update('room_number', v)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Input
              label="Floor"
              placeholder="2"
              value={form.floor}
              onChangeText={v => update('floor', v)}
              keyboardType="number-pad"
              style={{ flex: 1 }}
            />
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
  header: {
    backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
  },
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
  row: { flexDirection: 'row' },
  submitBtn: { marginTop: 24 },
});
