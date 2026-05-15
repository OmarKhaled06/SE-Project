import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ScrollView, Image, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { issuesAPI, absoluteUrl } from '../../services/api';
import { StatusBadge, PriorityBadge, EmptyState, LoadingScreen, Button } from '../../components/UI';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../utils/AuthContext';

// ── Assigned Issues Screen ──────────────────────
export function WorkerIssuesScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = async () => {
    try {
      const res = await issuesAPI.getAssigned();
      setIssues(res.data.issues || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load assigned issues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchIssues(); }, []));

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

  const renderItem = ({ item }) => {
    const isHigh = item.priority === 'HIGH' || item.priority === 'URGENT';
    return (
      <TouchableOpacity
        style={[styles.card, isHigh && styles.cardHighPriority]}
        onPress={() => navigation.navigate('WorkerIssueWork', { issueId: item.id })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>📍 {item.location || 'No location'}</Text>
          <Text style={styles.metaText}>📅 {formatDate(item.createdAt)}</Text>
          <PriorityBadge priority={item.priority} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingScreen />;

  const activeCount = issues.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.workerName}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout, style: 'destructive' }])}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>{activeCount} active task{activeCount === 1 ? '' : 's'}</Text>
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, issues.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchIssues(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="🎉" title="All Clear!" subtitle="You have no assigned issues right now" />}
      />
    </View>
  );
}

// ── Work on Issue Screen ────────────────────────
export function WorkerIssueWorkScreen({ route, navigation }) {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchIssue = async () => {
    try {
      const res = await issuesAPI.getById(issueId);
      setIssue(res.data.issue);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssue(); }, []);

  const markInProgress = async () => {
    try {
      await issuesAPI.updateStatus(issueId, 'IN_PROGRESS');
      Alert.alert('✅', 'Marked as In Progress');
      fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    }
  };

  const pickCompletionPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const submitCompletion = async () => {
    if (!comment.trim() && !photo) {
      Alert.alert('Required', 'Add a comment or completion photo');
      return;
    }
    setSubmitting(true);
    try {
      if (comment.trim()) await issuesAPI.addComment(issueId, comment.trim());

      if (photo) {
        const formData = new FormData();
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('photo', { uri: photo.uri, name: filename || 'completion.jpg', type });
        await issuesAPI.uploadPhoto(issueId, formData, 'COMPLETION');
      }

      await issuesAPI.updateStatus(issueId, 'RESOLVED');

      Alert.alert('✅ Done!', 'Issue marked as resolved', [
        { text: 'Back', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit completion');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!issue) return null;

  const reportPhoto = issue.photos?.find((p) => p.kind === 'REPORT');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work on Issue</Text>
      </View>

      <View style={styles.workContent}>
        <View style={styles.badgeRow}>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </View>

        <Text style={styles.issueTitle}>{issue.title}</Text>
        <Text style={styles.issueDesc}>{issue.description}</Text>

        {reportPhoto && (
          <Image source={{ uri: absoluteUrl(reportPhoto.url) }} style={styles.issuePhoto} resizeMode="cover" />
        )}

        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>📍 Location</Text>
          <Text style={styles.locationValue}>{issue.location || 'Not specified'}</Text>
        </View>

        {/* Actions */}
        {(issue.status === 'PENDING' || issue.status === 'ASSIGNED') && (
          <Button title="🔧 Start Working (Mark In Progress)" onPress={markInProgress} style={styles.actionBtn} />
        )}

        {issue.status === 'IN_PROGRESS' && (
          <View style={styles.completionSection}>
            <Text style={styles.sectionTitle}>Mark as Complete</Text>

            <Text style={styles.inputLabel}>Comment / Notes</Text>
            <TextInput
              placeholder="Describe the work done..."
              value={comment}
              onChangeText={setComment}
              multiline
              style={styles.commentInput}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.inputLabel}>Completion Photo</Text>
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo.uri }} style={styles.completionPhoto} />
                <TouchableOpacity onPress={() => setPhoto(null)} style={styles.removePhoto}>
                  <Text style={styles.removePhotoText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPickerBtn} onPress={pickCompletionPhoto}>
                <Text style={styles.photoPickerText}>📸 Take Completion Photo</Text>
              </TouchableOpacity>
            )}

            <Button
              title="✅ Submit as Resolved"
              onPress={submitCompletion}
              loading={submitting}
              style={styles.submitBtn}
            />
          </View>
        )}

        {(issue.status === 'RESOLVED' || issue.status === 'CLOSED') && (
          <View style={styles.resolvedBanner}>
            <Text style={styles.resolvedText}>✅ This issue has been {issue.status.toLowerCase()}</Text>
          </View>
        )}

        {/* Comments */}
        {issue.comments?.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Work Log</Text>
            {issue.comments.map((c) => (
              <View key={c.id} style={styles.commentCard}>
                <Text style={styles.commentAuthor}>{c.author?.fullName}</Text>
                <Text style={styles.commentText}>{c.body}</Text>
                <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  backText: { color: '#FFFFFF99', fontSize: 14, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 14, color: '#FFFFFF99' },
  workerName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  logoutBtn: { color: COLORS.secondary, fontWeight: '700', fontSize: 14 },
  summaryBar: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 20, paddingVertical: 10 },
  summaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, elevation: 2,
  },
  cardHighPriority: { borderLeftWidth: 4, borderLeftColor: COLORS.danger },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  workContent: { padding: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  issueTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  issueDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  issuePhoto: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  locationCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  locationLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  locationValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  actionBtn: { marginBottom: 20 },
  completionSection: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  commentInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12,
    fontSize: 14, minHeight: 80, color: COLORS.textPrimary, marginBottom: 16,
  },
  photoPickerBtn: {
    borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginBottom: 16,
  },
  photoPickerText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
  photoPreview: { position: 'relative', marginBottom: 16 },
  completionPhoto: { width: '100%', height: 180, borderRadius: 12 },
  removePhoto: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, padding: 8, borderRadius: 20 },
  removePhotoText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  submitBtn: {},
  resolvedBanner: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  resolvedText: { fontSize: 16, fontWeight: '700', color: COLORS.success },
  commentsSection: { marginBottom: 20 },
  commentCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  commentText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  commentDate: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
});
