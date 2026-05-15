import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { issuesAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../utils/AuthContext';

export default function MyIssuesScreen({ navigation }) {
  const { logout, user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = async () => {
    try {
      const res = await issuesAPI.getMy();
      setIssues(res.data.issues || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load your issues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchIssues(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchIssues(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('IssueDetail', { issueId: item.id })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Issue'}</Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📍 {item.location || 'No location'}</Text>
        <Text style={styles.metaText}>📅 {formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.categoryText}>🏷 {item.category || 'General'}</Text>
        <PriorityBadge priority={item.priority} />
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen message="Loading your issues..." />;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>My Issues</Text>
          <Text style={styles.headerSub}>{user?.fullName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('SubmitIssue')}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Logout', 'Sign out?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout, style: 'destructive' }])}
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutText}>⎋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, issues.length === 0 && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title="No Issues Yet"
            subtitle="Tap '+ New' to report a facility issue on campus"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#FFFFFF99', marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  logoutBtn: { backgroundColor: '#FFFFFF22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  list: { padding: 16 },
  listEmpty: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryText: { fontSize: 12, color: COLORS.textSecondary },
});
