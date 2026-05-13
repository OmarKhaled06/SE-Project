import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity
} from 'react-native';
import { useAuth } from '../../utils/AuthContext';
import { Button, Input } from '../../components/UI';
import { COLORS } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation handled by AppNavigator role check
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏫</Text>
          </View>
          <Text style={styles.title}>CampusCare</Text>
          <Text style={styles.subtitle}>Smart Facility Management</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          <Input
            label="Email Address"
            placeholder="your.email@giu-uni.de"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPass}>
            <Text style={styles.showPassText}>{showPassword ? '🙈 Hide' : '👁 Show'} Password</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>German International University © 2024</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8
  },
  logoText: { fontSize: 44 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.secondary, fontWeight: '600', marginTop: 4 },
  form: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  showPass: { alignItems: 'flex-end', marginTop: -8, marginBottom: 16 },
  showPassText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
  loginBtn: { marginTop: 8 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  footer: { textAlign: 'center', color: COLORS.textLight, fontSize: 12, marginTop: 32, paddingBottom: 20 },
});
