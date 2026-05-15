import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Backend listens on port 4000 (see backend/src/server.ts).
// Point this at your dev machine's LAN IP so a real phone on the same Wi-Fi can reach it.
// (10.0.2.2 only works inside the Android emulator; localhost only works for iOS simulator.)
export const BASE_URL = 'http://172.20.10.9:4000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('campuscare_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  console.log('[API →]', config.method?.toUpperCase(), (config.baseURL || '') + (config.url || ''));
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log('[API ✓]', res.status, res.config.url);
    return res;
  },
  (err) => {
    console.log('[API ✗]', err.message, 'url:', err.config?.url, 'status:', err.response?.status);
    return Promise.reject(err);
  }
);

// Resolve a relative /uploads/... URL returned by the backend into an absolute one.
export const absoluteUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Categories are a backend Prisma enum — there is no /categories endpoint.
// Keep this list in sync with backend/prisma/schema.prisma -> enum Category.
export const CATEGORIES = [
  { key: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
  { key: 'PLUMBING',   label: 'Plumbing',   icon: '🚰' },
  { key: 'HVAC',       label: 'HVAC',       icon: '❄️' },
  { key: 'CLEANING',   label: 'Cleaning',   icon: '🧹' },
  { key: 'FURNITURE',  label: 'Furniture',  icon: '🪑' },
  { key: 'SAFETY',     label: 'Safety',     icon: '🦺' },
  { key: 'IT',         label: 'IT',         icon: '💻' },
  { key: 'OTHER',      label: 'Other',      icon: '📦' },
];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const STATUSES   = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
  // payload: { email, password, fullName, phone?, role? }
  register: (data) => api.post('/auth/register', data),
  login:    (email, password) => api.post('/auth/login', { email, password }),
  logout:   () => api.post('/auth/logout'),
  getMe:    () => api.get('/auth/me'),
};

// ── Issues ───────────────────────────────────────────
export const issuesAPI = {
  // payload: { title, description, location, category, priority? }
  create:       (data) => api.post('/issues', data),
  getAll:       (params) => api.get('/issues', { params }),     // managers see all; pass { status } to filter
  getMy:        () => api.get('/issues/my'),
  getAssigned:  () => api.get('/issues/assigned'),
  getById:      (id) => api.get(`/issues/${id}`),
  updateStatus: (id, status)   => api.put(`/issues/${id}/status`,   { status }),
  setPriority:  (id, priority) => api.put(`/issues/${id}/priority`, { priority }),
  assign:       (id, assigneeId) => api.put(`/issues/${id}/assign`, { assigneeId }),
  close:        (id) => api.put(`/issues/${id}/close`),
  addComment:   (id, body) => api.post(`/issues/${id}/comments`, { body }),
  uploadPhoto:  (id, formData, kind = 'REPORT') => {
    formData.append('kind', kind);
    return api.post(`/issues/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete:       (id) => api.delete(`/issues/${id}`),
};

// ── Manager ──────────────────────────────────────────
export const managerAPI = {
  getWorkers:         () => api.get('/manager/workers'),
  updateWorkerStatus: (id, active) => api.put(`/manager/workers/${id}/status`, { active }),
  getStats:           () => api.get('/manager/stats'),
};

// ── Admin ────────────────────────────────────────────
export const adminAPI = {
  getUsers:         () => api.get('/admin/users'),
  updateUserStatus: (id, active) => api.put(`/admin/users/${id}/status`, { active }),
  updateUserRole:   (id, role, on) => api.put(`/admin/users/${id}/role`, { role, on }),
};

// ── Notifications ────────────────────────────────────
export const notificationsAPI = {
  getAll:      () => api.get('/notifications'),
  markRead:    (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
