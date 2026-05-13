import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: 'http://172.20.10.9:4000',
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
