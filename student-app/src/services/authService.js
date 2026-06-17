import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // 登录
  login: async (phone, password) => {
    const response = await api.post('/auth/login', { phone, password });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  // 注册
  register: async (phone, password, role, nickname) => {
    const response = await api.post('/auth/register', { phone, password, role, nickname });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.user;
  },

  // 登出
  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
  },

  // 检查登录状态
  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },

  // 获取本地存储的用户信息
  getLocalUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
