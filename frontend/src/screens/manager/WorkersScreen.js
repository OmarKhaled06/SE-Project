import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { managerAPI } from '../../services/api';
import { LoadingScreen, EmptyState } from '../../components/UI';
import { COLORS } from '../../utils/theme';

export default function WorkersScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await managerAPI.getWorkers();
      setWorkers(res.data.workers || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load workers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchWorkers(); }, []));

  const toggleStatus = (worker) => {
    const action = worker.is_active ? 'deactivate' : 'activate';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Worker`,
      `Are you sure you want to ${action} ${worker.name}?`, [
      { text: 'Cancel' },
      { text: action.charAt(0).toUpperCase() + action.slice(1), style: worker.is_active ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await managerAPI.updateWorkerStatus(worker.id, !worker.is_active);
            fetchWorkers();
          } catch (err) {
            Alert.alert('Error', 'Failed to update worker status');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: item.is_active ? COLORS.primary : COLORS.textLight }]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.phone_number && <Text style={styles.phone}>📞 {item.phone_number}</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.statusBtn, { backgroundColor: item.is_active ? '#FEE2E2' : '#D1FAE5' }]}
        onPress={() => toggleStatus(item)}
      >
        <Text style={[styles.statusBtnText, { color: item.is_active ? COLORS.danger : COLORS.success }]}>
          {item.is_active ? 'Deactivate' : 'Activate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Workers</Text>
        <Text style={styles.headerSub}>{workers.length} workers registered</Text>
      </View>
      <FlatList
        data={workers}
        keyExtractor={w => w.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, workers.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWorkers(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="👷" title="No Workers Yet" subtitle="Workers who register will appear here" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { color: '#FFFFFF99', fontSize: 14, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#FFFFFF88', marginTop: 4 },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  email: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
});
