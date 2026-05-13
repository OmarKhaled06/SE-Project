import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../../services/api';
import { LoadingScreen, EmptyState } from '../../components/UI';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../utils/AuthContext';

const ROLE_COLORS = {
  community_member: '#4299E1',
  worker: '#ED8936',
  facility_manager: '#9F7AEA',
  admin: '#E53E3E',
};

export default function AdminUsersScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUsers(); }, []));

  const toggleStatus = (u) => {
    const action = u.is_active ? 'deactivate' : 'activate';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `${action.charAt(0).toUpperCase() + action.slice(1)} ${u.name}?`, [
      { text: 'Cancel' },
      {
        text: action.charAt(0).toUpperCase() + action.slice(1),
        style: u.is_active ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await adminAPI.updateUserStatus(u.id, !u.is_active);
            fetchUsers();
          } catch (err) {
            Alert.alert('Error', 'Failed to update user');
          }
        }
      }
    ]);
  };

  const ROLES = ['all', 'community_member', 'worker', 'facility_manager'];
  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.is_active && styles.cardInactive]}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.role] || COLORS.primary }]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {!item.is_active && <Text style={styles.inactiveTag}>Inactive</Text>}
          </View>
          <Text style={styles.email}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + '22' }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>
              {item.role?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </View>
      {item.id !== user.id && (
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: item.is_active ? '#FEE2E2' : '#D1FAE5' }]}
          onPress={() => toggleStatus(item)}
        >
          <Text style={[styles.toggleText, { color: item.is_active ? COLORS.danger : COLORS.success }]}>
            {item.is_active ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>{users.length} registered users</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout, style: 'destructive' }])}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter */}
      <View style={styles.filterRow}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, filter === r && styles.filterChipActive]}
            onPress={() => setFilter(r)}
          >
            <Text style={[styles.filterText, filter === r && styles.filterTextActive]}>
              {r === 'all' ? 'All' : r.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={u => u.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, filteredUsers.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="👥" title="No Users Found" subtitle="No users match this filter" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#FFFFFF88', marginTop: 2 },
  logoutText: { color: COLORS.secondary, fontWeight: '700', fontSize: 14 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, gap: 8, flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  cardInactive: { opacity: 0.6 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  inactiveTag: {
    fontSize: 10, color: COLORS.danger, fontWeight: '700',
    backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  email: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: { marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toggleText: { fontSize: 12, fontWeight: '700' },
});
