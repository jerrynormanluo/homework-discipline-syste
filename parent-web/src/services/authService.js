import api from './api';

export const authService = {
  // 登录
  login: async (phone, password) => {
    const response = await api.post('/auth/login', { phone, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  // 注册
  register: async (phone, password, role, nickname) => {
    const response = await api.post('/auth/register', { phone, password, role, nickname });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 检查登录状态
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // 获取本地存储的用户信息
  getLocalUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
