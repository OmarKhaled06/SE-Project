import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity
} from 'react-native';
import { useAuth } from '../../utils/AuthContext';
import { Button, Input } from '../../components/UI';
import { COLORS } from '../../utils/theme';

const ROLES = [
  { key: 'MEMBER',  label: '🎓 Community Member',  desc: 'Report facility issues' },
  { key: 'WORKER',  label: '🔧 Maintenance Worker', desc: 'Fix assigned issues' },
  { key: 'MANAGER', label: '📋 Facility Manager',   desc: 'Triage and assign issues' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'MEMBER' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password || !form.role) {
      Alert.alert('Missing Fields', 'Please fill in all required fields and select a role.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      await register(payload);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join CampusCare to report issues</Text>
        </View>

        <View style={styles.form}>
          <Input label="Full Name *" placeholder="Omar Ahmed" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
          <Input label="Email Address *" placeholder="omar@giu-uni.de" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password *" placeholder="Min. 6 characters" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
          <Input label="Phone Number (Optional)" placeholder="+20 1xx xxx xxxx" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />

          <Text style={styles.roleLabel}>Select Your Role *</Text>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[styles.roleCard, form.role === role.key && styles.roleCardSelected]}
              onPress={() => update('role', role.key)}
            >
              <View style={styles.roleCardInner}>
                <Text style={styles.roleCardLabel}>{role.label}</Text>
                <Text style={styles.roleCardDesc}>{role.desc}</Text>
              </View>
              <View style={[styles.radioOuter, form.role === role.key && styles.radioOuterSelected]}>
                {form.role === role.key && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  roleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2,
    borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  roleCardSelected: { borderColor: COLORS.primary, backgroundColor: '#EBF1FB' },
  roleCardInner: { flex: 1 },
  roleCardLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  roleCardDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  registerBtn: { marginTop: 20 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
