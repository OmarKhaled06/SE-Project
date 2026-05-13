import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

export type Role = 'MEMBER' | 'MANAGER' | 'WORKER' | 'ADMIN';
export interface User { id: string; email: string; fullName: string; phone?: string; roles: Role[]; active: boolean; }

interface AuthState {
  user: User | null;
  loading: boolean;
  primaryRole: () => Role;
  hasRole: (r: Role) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  primaryRole: () => {
    const r = get().user?.roles ?? [];
    if (r.includes('ADMIN')) return 'ADMIN';
    if (r.includes('MANAGER')) return 'MANAGER';
    if (r.includes('WORKER')) return 'WORKER';
    return 'MEMBER';
  },
  hasRole: (role) => !!get().user?.roles.includes(role),
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    set({ user: data.user });
  },
  register: async (email, password, fullName, phone) => {
    const { data } = await api.post('/api/auth/register', { email, password, fullName, phone });
    await AsyncStorage.setItem('token', data.token);
    set({ user: data.user });
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null });
  },
  restore: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) { set({ loading: false }); return; }
    try {
      const { data } = await api.get('/api/auth/me');
      set({ user: data.user, loading: false });
    } catch { set({ user: null, loading: false }); }
  },
}));
