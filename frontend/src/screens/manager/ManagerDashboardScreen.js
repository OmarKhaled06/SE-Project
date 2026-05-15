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

const STATUS_FILTERS = ['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function ManagerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      const params = activeFilter !== 'ALL' ? { status: activeFilter } : {};
      const [issuesRes, statsRes] = await Promise.all([
        issuesAPI.getAll(params),
        managerAPI.getStats(),
      ]);
      setIssues(issuesRes.data.issues || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [activeFilter]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ManagerIssueDetail', { issueId: item.id })}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.cardBadges}>
          <StatusBadge status={item.status} />
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📍 {item.location || 'No location'}</Text>
        <Text style={styles.metaText}>🏷 {item.category || 'General'}</Text>
        <PriorityBadge priority={item.priority} />
      </View>
      {item.assignee && (
        <View style={styles.workerRow}>
          <Text style={styles.workerText}>👷 {item.assignee.fullName}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout, style: 'destructive' }])}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: COLORS.textSecondary }]}>
            <Text style={styles.statNum}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.warning }]}>
            <Text style={styles.statNum}>{stats.pending || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#4338CA' }]}>
            <Text style={styles.statNum}>{stats.assigned || 0}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.primaryLight }]}>
            <Text style={styles.statNum}>{stats.in_progress || 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
            <Text style={styles.statNum}>{stats.resolved || 0}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.textLight }]}>
            <Text style={styles.statNum}>{stats.closed || 0}</Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f === 'ALL' ? 'All Issues' : f.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, issues.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="📋" title="No Issues Found" subtitle="No issues match the selected filter" />}
      />

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
  statsWrap: { paddingVertical: 12 },
  statsRow: { paddingHorizontal: 16, gap: 8, alignItems: 'flex-start' },
  statCard: {
    width: 96, minHeight: 78, backgroundColor: COLORS.surface, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 12,
    borderTopWidth: 3, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 26 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  filtersWrap: { paddingVertical: 8, marginBottom: 4 },
  filtersRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
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
