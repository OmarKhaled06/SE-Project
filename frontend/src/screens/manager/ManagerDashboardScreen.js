import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { issuesAPI, managerAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../utils/AuthContext';

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'resolved', 'closed'];

export default function ManagerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchData = async () => {
    try {
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const [issuesRes, statsRes] = await Promise.all([
        issuesAPI.getAll(params),
        managerAPI.getStats()
      ]);
      setIssues(issuesRes.data.tickets || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [activeFilter]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ManagerIssueDetail', { issueId: item.id })}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.categories?.category_name || 'Issue'}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.cardBadges}>
          <StatusBadge status={item.status} />
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📍 {item.locations?.building_name || 'No location'}</Text>
        <Text style={styles.metaText}>🏷 {item.categories?.category_name || 'General'}</Text>
        <PriorityBadge priority={item.priority} />
      </View>
      {item.worker && (
        <View style={styles.workerRow}>
          <Text style={styles.workerText}>👷 {item.worker.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user.name}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout, style: 'destructive' }])}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: COLORS.textSecondary }]}>
          <Text style={styles.statNum}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.warning }]}>
          <Text style={styles.statNum}>{stats.pending || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.primaryLight }]}>
          <Text style={styles.statNum}>{stats.in_progress || 0}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
          <Text style={styles.statNum}>{stats.resolved || 0}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All Issues' : f.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Issues List */}
      <FlatList
        data={issues}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, issues.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="📋" title="No Issues Found" subtitle="No issues match the selected filter" />}
      />

      {/* Workers Button */}
      <TouchableOpacity style={styles.workersBtn} onPress={() => navigation.navigate('Workers')}>
        <Text style={styles.workersBtnText}>👷 Manage Workers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
  },
  greeting: { fontSize: 14, color: '#FFFFFF99' },
  name: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  logoutText: { color: COLORS.secondary, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderTopWidth: 3, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  filters: { maxHeight: 50, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface, marginRight: 8, borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTopLeft: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  cardBadges: { alignItems: 'flex-end', gap: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  workerRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  workerText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  workersBtn: {
    margin: 16, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  workersBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
