import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, TextInput, RefreshControl
} from 'react-native';
import { issuesAPI, absoluteUrl } from '../../services/api';
import { StatusBadge, PriorityBadge, Button, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../utils/AuthContext';

export default function IssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;
  const { role } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comment, setComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const fetchIssue = async () => {
    try {
      const res = await issuesAPI.getById(issueId);
      setIssue(res.data.issue);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load issue details');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchIssue(); }, []);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setAddingComment(true);
    try {
      await issuesAPI.addComment(issueId, comment.trim());
      setComment('');
      fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'N/A';

  if (loading) return <LoadingScreen message="Loading issue..." />;
  if (!issue) return null;

  const reportPhoto     = issue.photos?.find((p) => p.kind === 'REPORT');
  const completionPhoto = issue.photos?.find((p) => p.kind === 'COMPLETION');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchIssue(); }} tintColor={COLORS.primary} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </View>

        <Text style={styles.title}>{issue.title}</Text>
        <Text style={styles.description}>{issue.description}</Text>

        {reportPhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📷 Issue Photo</Text>
            <Image source={{ uri: absoluteUrl(reportPhoto.url) }} style={styles.photo} resizeMode="cover" />
          </View>
        )}

        {completionPhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>✅ Completion Photo</Text>
            <Image source={{ uri: absoluteUrl(completionPhoto.url) }} style={styles.photo} resizeMode="cover" />
          </View>
        )}

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{issue.category}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Submitted</Text>
            <Text style={styles.infoValue}>{formatDate(issue.createdAt)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{issue.location || 'Not specified'}</Text>
          </View>
          {issue.assignee && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Assigned Worker</Text>
              <Text style={styles.infoValue}>{issue.assignee.fullName}</Text>
            </View>
          )}
          {issue.reporter && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Reported By</Text>
              <Text style={styles.infoValue}>{issue.reporter.fullName}</Text>
            </View>
          )}
          {issue.resolvedAt && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Resolved</Text>
              <Text style={styles.infoValue}>{formatDate(issue.resolvedAt)}</Text>
            </View>
          )}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>💬 Comments ({issue.comments?.length || 0})</Text>
          {issue.comments?.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.author?.fullName || 'Unknown'}</Text>
                <Text style={styles.commentRole}>
                  {(c.author?.roles || []).map((r) => (r.role ? r.role : r)).join(', ')}
                </Text>
              </View>
              <Text style={styles.commentContent}>{c.body}</Text>
              <Text style={styles.commentDate}>{formatDate(c.createdAt)}</Text>
            </View>
          ))}

          {/* All authenticated users can comment */}
          <View style={styles.commentInput}>
            <TextInput
              placeholder="Add a comment..."
              value={comment}
              onChangeText={setComment}
              multiline
              style={styles.commentTextInput}
              placeholderTextColor={COLORS.textLight}
            />
            <Button
              title={addingComment ? 'Adding...' : 'Post'}
              onPress={handleAddComment}
              loading={addingComment}
              style={styles.commentBtn}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#FFFFFF99', fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 20 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  photo: { width: '100%', height: 220, borderRadius: 12 },
  infoGrid: { gap: 10, marginBottom: 20 },
  infoCard: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  commentCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  commentRole: { fontSize: 11, color: COLORS.textLight },
  commentContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  commentDate: { fontSize: 11, color: COLORS.textLight, marginTop: 6 },
  commentInput: { marginTop: 10 },
  commentTextInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 80, color: COLORS.textPrimary,
    backgroundColor: COLORS.surface, marginBottom: 8,
  },
  commentBtn: { paddingVertical: 10 },
});
