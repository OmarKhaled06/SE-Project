import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsAPI } from '../services/api';
import { LoadingScreen, EmptyState } from '../components/UI';
import { COLORS } from '../utils/theme';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchNotifications();
    } catch (e) {}
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {}
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diffMs = now - date;
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => !item.read && markRead(item.id)}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.dot, !item.read && styles.dotUnread]} />
        <View style={styles.cardContent}>
          <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.message}>{item.body}</Text>
          <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>🔔 {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, notifications.length === 0 && { flex: 1 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="🔔" title="No Notifications" subtitle="You're all caught up!" />
        }
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  markAllBtn: { backgroundColor: '#FFFFFF22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  markAllText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  unreadBanner: {
    backgroundColor: '#EBF8FF', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#BEE3F8',
  },
  unreadBannerText: { color: '#2B6CB0', fontWeight: '600', fontSize: 13 },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 1,
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary, backgroundColor: '#F0F5FF' },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginTop: 5, marginRight: 12 },
  dotUnread: { backgroundColor: COLORS.primary },
  cardContent: { flex: 1 },
  title: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  titleUnread: { color: COLORS.textPrimary, fontWeight: '700' },
  message: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginTop: 2 },
  time: { fontSize: 11, color: COLORS.textLight, marginTop: 6 },
});
