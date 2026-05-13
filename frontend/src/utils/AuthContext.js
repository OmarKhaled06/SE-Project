import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('campuscare_token');
      const storedUser = await SecureStore.getItemAsync('campuscare_user');
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

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { user: userData, token: userToken } = res.data;
    await SecureStore.setItemAsync('campuscare_token', userToken);
    await SecureStore.setItemAsync('campuscare_user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user: userData, token: userToken } = res.data;
    await SecureStore.setItemAsync('campuscare_token', userToken);
    await SecureStore.setItemAsync('campuscare_user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
    return userData;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (e) {}
    await SecureStore.deleteItemAsync('campuscare_token');
    await SecureStore.deleteItemAsync('campuscare_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
