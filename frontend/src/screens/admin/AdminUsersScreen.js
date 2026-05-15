import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../../services/api';
import { LoadingScreen, EmptyState, Button } from '../../components/UI';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../utils/AuthContext';

const ROLE_COLORS = {
  MEMBER:  '#4299E1',
  WORKER:  '#ED8936',
  MANAGER: '#9F7AEA',
  ADMIN:   '#E53E3E',
};
const ROLE_LABELS = {
  MEMBER:  'Community Member',
  WORKER:  'Worker',
  MANAGER: 'Facility Manager',
  ADMIN:   'System Admin',
};
const ALL_ROLES = ['MEMBER', 'WORKER', 'MANAGER', 'ADMIN'];

export default function AdminUsersScreen() {
  const { user: me, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [roleEditUser, setRoleEditUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUsers(); }, []));

  const userRoleNames = (u) => (u.roles || []).map((r) => (r.role ? r.role : r));

  const toggleStatus = (u) => {
    const action = u.active ? 'deactivate' : 'activate';
    const verb   = action.charAt(0).toUpperCase() + action.slice(1);
    Alert.alert(`${verb} User`, `${verb} ${u.fullName}?`, [
      { text: 'Cancel' },
      {
        text: verb,
        style: u.active ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await adminAPI.updateUserStatus(u.id, !u.active);
            fetchUsers();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to update user');
          }
        },
      },
    ]);
  };

  const toggleRole = async (targetUser, role, currentlyOn) => {
    try {
      await adminAPI.updateUserRole(targetUser.id, role, !currentlyOn);
      const refreshed = await adminAPI.getUsers();
      setUsers(refreshed.data.users || []);
      setRoleEditUser(refreshed.data.users.find((u) => u.id === targetUser.id) || null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update role');
    }
  };

  const filteredUsers = filter === 'ALL'
    ? users
    : users.filter((u) => userRoleNames(u).includes(filter));

  const renderItem = ({ item }) => {
    const roles = userRoleNames(item);
    const primary = roles[0] || 'MEMBER';
    return (
      <View style={[styles.card, !item.active && styles.cardInactive]}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[primary] || COLORS.primary }]}>
            <Text style={styles.avatarText}>{item.fullName?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.fullName}</Text>
              {!item.active && <Text style={styles.inactiveTag}>Inactive</Text>}
            </View>
            <Text style={styles.email}>{item.email}</Text>
            <View style={styles.rolesRow}>
              {roles.length === 0 && <Text style={styles.noRoleText}>no roles</Text>}
              {roles.map((r) => (
                <View key={r} style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[r] || '#999') + '22' }]}>
                  <Text style={[styles.roleText, { color: ROLE_COLORS[r] || '#666' }]}>{ROLE_LABELS[r] || r}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        {item.id !== me?.id && (
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: item.active ? '#FEE2E2' : '#D1FAE5' }]}
              onPress={() => toggleStatus(item)}
            >
              <Text style={[styles.toggleText, { color: item.active ? COLORS.danger : COLORS.success }]}>
                {item.active ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: '#EBF1FB' }]}
              onPress={() => setRoleEditUser(item)}
            >
              <Text style={[styles.toggleText, { color: COLORS.primary }]}>Roles</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <LoadingScreen />;

  const editingRoles = roleEditUser ? userRoleNames(roleEditUser) : [];

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

      <View style={styles.filterRow}>
        {['ALL', ...ALL_ROLES].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, filter === r && styles.filterChipActive]}
            onPress={() => setFilter(r)}
          >
            <Text style={[styles.filterText, filter === r && styles.filterTextActive]}>
              {r === 'ALL' ? 'All' : (ROLE_LABELS[r] || r)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, filteredUsers.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="👥" title="No Users Found" subtitle="No users match this filter" />}
      />

      <Modal visible={!!roleEditUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Roles for {roleEditUser?.fullName}</Text>
            {ALL_ROLES.map((r) => {
              const on = editingRoles.includes(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleToggle, on && styles.roleToggleOn]}
                  onPress={() => toggleRole(roleEditUser, r, on)}
                >
                  <Text style={styles.roleToggleText}>{ROLE_LABELS[r] || r}</Text>
                  <Text style={[styles.roleToggleStatus, { color: on ? COLORS.success : COLORS.textLight }]}>
                    {on ? '✓ Granted' : '— Not granted'}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Button title="Done" onPress={() => setRoleEditUser(null)} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
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
  filterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
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
  rolesRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '700' },
  noRoleText: { fontSize: 11, color: COLORS.textLight, fontStyle: 'italic' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toggleText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  roleToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: COLORS.background,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  roleToggleOn: { borderColor: COLORS.primary, backgroundColor: '#EBF1FB' },
  roleToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  roleToggleStatus: { fontSize: 12, fontWeight: '700' },
});
