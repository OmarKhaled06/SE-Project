import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, Modal, FlatList
} from 'react-native';
import { issuesAPI, managerAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, Button, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../utils/theme';

const STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function ManagerIssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const fetchIssue = async () => {
    try {
      const [issueRes, workersRes] = await Promise.all([
        issuesAPI.getById(issueId),
        managerAPI.getWorkers()
      ]);
      setIssue(issueRes.data.ticket);
      setWorkers(workersRes.data.workers || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssue(); }, []);

  const handleAssign = async (worker) => {
    setShowAssignModal(false);
    try {
      await issuesAPI.assign(issueId, worker.id);
      Alert.alert('✅ Assigned', `Issue assigned to ${worker.name}`);
      fetchIssue();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to assign issue');
    }
  };

  const handleStatusUpdate = async (status) => {
    setShowStatusModal(false);
    try {
      await issuesAPI.updateStatus(issueId, status);
      Alert.alert('✅ Updated', `Status updated to ${status.replace('_', ' ')}`);
      fetchIssue();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handlePriorityUpdate = async (priority) => {
    setShowPriorityModal(false);
    try {
      await issuesAPI.setPriority(issueId, priority);
      fetchIssue();
    } catch (err) {
      Alert.alert('Error', 'Failed to update priority');
    }
  };

  const handleClose = () => {
    Alert.alert('Close Issue', 'Mark this issue as closed and resolved?', [
      { text: 'Cancel' },
      { text: 'Close Issue', style: 'destructive', onPress: async () => {
        try {
          await issuesAPI.close(issueId);
          Alert.alert('✅ Closed', 'Issue has been closed');
          navigation.goBack();
        } catch (err) {
          Alert.alert('Error', 'Failed to close issue');
        }
      }}
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Issue', 'This action cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await issuesAPI.delete(issueId);
          navigation.goBack();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete issue');
        }
      }}
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!issue) return null;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Issue</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </View>

          <Text style={styles.title}>{issue.title || issue.categories?.category_name}</Text>
          <Text style={styles.desc}>{issue.description}</Text>

          {issue.photo_url && (
            <Image source={{ uri: issue.photo_url }} style={styles.photo} resizeMode="cover" />
          )}

          {/* Info */}
          <View style={styles.infoSection}>
            <InfoRow label="Reported By" value={issue.reporter?.name || 'Unknown'} />
            <InfoRow label="Category" value={issue.categories?.category_name || 'General'} />
            <InfoRow label="Location" value={issue.locations ? `${issue.locations.building_name} ${issue.locations.room_number || ''}` : 'Not set'} />
            <InfoRow label="Assigned To" value={issue.worker?.name || 'Unassigned'} />
            <InfoRow label="Submitted" value={new Date(issue.created_at).toLocaleDateString('en-GB')} />
          </View>

          {/* Action Buttons */}
          <Text style={styles.actionsLabel}>Actions</Text>

          <Button
            title="👷 Assign to Worker"
            onPress={() => setShowAssignModal(true)}
            style={styles.actionBtn}
          />
          <Button
            title="🔄 Update Status"
            onPress={() => setShowStatusModal(true)}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title="⚡ Set Priority"
            onPress={() => setShowPriorityModal(true)}
            variant="outline"
            style={styles.actionBtn}
          />
          {issue.status !== 'closed' && (
            <Button
              title="✅ Close Issue"
              onPress={handleClose}
              variant="secondary"
              style={styles.actionBtn}
            />
          )}
          <Button
            title="🗑 Delete Issue"
            onPress={handleDelete}
            variant="danger"
            style={styles.actionBtn}
          />

          {/* Comments */}
          {issue.comments?.length > 0 && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsLabel}>Comments ({issue.comments.length})</Text>
              {issue.comments.map(c => (
                <View key={c.id} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>{c.user?.name}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              ))}
            </View>
          )}

          {issue.completion_photo_url && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.actionsLabel}>✅ Completion Photo</Text>
              <Image source={{ uri: issue.completion_photo_url }} style={styles.photo} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Assign Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Worker</Text>
            <FlatList
              data={workers.filter(w => w.is_active)}
              keyExtractor={w => w.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleAssign(item)}>
                  <Text style={styles.modalItemText}>👷 {item.name}</Text>
                  <Text style={styles.modalItemSub}>{item.email}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyModal}>No active workers found</Text>}
            />
            <Button title="Cancel" onPress={() => setShowAssignModal(false)} variant="outline" />
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {STATUSES.map(s => (
              <TouchableOpacity key={s} style={[styles.modalItem, issue.status === s && styles.modalItemActive]} onPress={() => handleStatusUpdate(s)}>
                <Text style={[styles.modalItemText, { textTransform: 'capitalize' }]}>{s.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" onPress={() => setShowStatusModal(false)} variant="outline" style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      {/* Priority Modal */}
      <Modal visible={showPriorityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Set Priority</Text>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p} style={[styles.modalItem, issue.priority === p && styles.modalItemActive]} onPress={() => handlePriorityUpdate(p)}>
                <Text style={[styles.modalItemText, { textTransform: 'capitalize' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" onPress={() => setShowPriorityModal(false)} variant="outline" style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { color: '#FFFFFF99', fontSize: 14, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  photo: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  infoSection: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },
  actionsLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionBtn: { marginBottom: 10 },
  commentsSection: { marginTop: 20 },
  commentsLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  commentCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  commentText: { fontSize: 13, color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  modalItem: { padding: 16, borderRadius: 10, marginBottom: 8, backgroundColor: COLORS.background },
  modalItemActive: { backgroundColor: '#EBF1FB', borderWidth: 1.5, borderColor: COLORS.primary },
  modalItemText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  modalItemSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emptyModal: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
});
