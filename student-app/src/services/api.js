import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('获取token失败:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储
      await AsyncStorage.multiRemove(['token', 'user']);
      // 可以在这里跳转到登录页
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
