import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Pick the highest-privilege role from the user's role array.
// Backend returns roles as an array of enum strings: MEMBER, WORKER, MANAGER, ADMIN.
export const ROLE_PRIORITY = ['ADMIN', 'MANAGER', 'WORKER', 'MEMBER'];
export const primaryRole = (user) => {
  if (!user) return null;
  const list = Array.isArray(user.roles) ? user.roles : [];
  return ROLE_PRIORITY.find((r) => list.includes(r)) || 'MEMBER';
};

export const ROLE_LABELS = {
  MEMBER:  'Community Member',
  WORKER:  'Maintenance Worker',
  MANAGER: 'Facility Manager',
  ADMIN:   'System Admin',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStoredAuth(); }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('campuscare_token');
      const storedUser  = await SecureStore.getItemAsync('campuscare_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Load auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (userData, userToken) => {
    await SecureStore.setItemAsync('campuscare_token', userToken);
    await SecureStore.setItemAsync('campuscare_user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  };

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { user: userData, token: userToken } = res.data;
    await persist(userData, userToken);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user: userData, token: userToken } = res.data;
    await persist(userData, userToken);
    return userData;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (e) {}
    await SecureStore.deleteItemAsync('campuscare_token');
    await SecureStore.deleteItemAsync('campuscare_user');
    setUser(null);
    setToken(null);
  };

  const refreshMe = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data?.user) {
        const stored = await SecureStore.getItemAsync('campuscare_token');
        if (stored) await persist(res.data.user, stored);
      }
    } catch (e) {}
  };

  const role = primaryRole(user);

  return (
    <AuthContext.Provider value={{ user, token, role, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
