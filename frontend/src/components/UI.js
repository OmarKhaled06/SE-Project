import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput
} from 'react-native';
import { COLORS, SHADOWS } from '../utils/theme';

// ── Button ──────────────────────────────────────
export const Button = ({ title, onPress, loading, variant = 'primary', style, disabled }) => {
  const bgColor = variant === 'primary' ? COLORS.primary
    : variant === 'secondary' ? COLORS.secondary
    : variant === 'danger' ? COLORS.danger
    : variant === 'outline' ? 'transparent'
    : COLORS.primary;

  const textColor = variant === 'outline' ? COLORS.primary : '#FFFFFF';
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor, borderWidth: variant === 'outline' ? 2 : 0, opacity: disabled ? 0.6 : 1 },
        style
      ]}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

// ── Input ──────────────────────────────────────
export const Input = ({ label, error, style, ...props }) => (
  <View style={[styles.inputContainer, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={COLORS.textLight}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Card ────────────────────────────────────────
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ── StatusBadge ─────────────────────────────────
export const StatusBadge = ({ status }) => {
  const colors = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    in_progress: { bg: '#DBEAFE', text: '#2563EB' },
    resolved: { bg: '#D1FAE5', text: '#059669' },
    closed: { bg: '#F3F4F6', text: '#6B7280' },
  };
  const c = colors[status] || colors.pending;
  const label = status?.replace('_', ' ').toUpperCase();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ── PriorityBadge ───────────────────────────────
export const PriorityBadge = ({ priority }) => {
  const colors = {
    low: { bg: '#D1FAE5', text: '#059669' },
    medium: { bg: '#FEF3C7', text: '#D97706' },
    high: { bg: '#FEE2E2', text: '#DC2626' },
  };
  const c = colors[priority] || colors.medium;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{priority?.toUpperCase()}</Text>
    </View>
  );
};

// ── LoadingScreen ───────────────────────────────
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={styles.loadingScreen}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ── EmptyState ──────────────────────────────────
export const EmptyState = ({ icon = '📭', title, subtitle }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ── SectionHeader ───────────────────────────────
export const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  buttonText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 15 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.background },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
});
