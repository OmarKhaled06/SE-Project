import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL when deploying
// For local dev use your machine's IP: http://192.168.x.x:5000
export const BASE_URL = 'http://10.0.2.2:5000'; // Android emulator
// export const BASE_URL = 'http://localhost:5000'; // iOS simulator

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('campuscare_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Issues
export const issuesAPI = {
  create: (formData) => api.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/issues', { params }),
  getMy: () => api.get('/issues/my'),
  getAssigned: () => api.get('/issues/assigned'),
  getById: (id) => api.get(`/issues/${id}`),
  updateStatus: (id, status) => api.put(`/issues/${id}/status`, { status }),
  assign: (id, worker_id) => api.put(`/issues/${id}/assign`, { worker_id }),
  close: (id) => api.put(`/issues/${id}/close`),
  setPriority: (id, priority) => api.put(`/issues/${id}/priority`, { priority }),
  addComment: (id, content) => api.post(`/issues/${id}/comments`, { content }),
  uploadPhoto: (id, formData) => api.post(`/issues/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/issues/${id}`),
};

// Manager
export const managerAPI = {
  getWorkers: () => api.get('/manager/workers'),
  updateWorkerStatus: (id, is_active) => api.put(`/manager/workers/${id}/status`, { is_active }),
  getStats: () => api.get('/manager/stats'),
};

// Admin
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (id, is_active) => api.put(`/admin/users/${id}/status`, { is_active }),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
