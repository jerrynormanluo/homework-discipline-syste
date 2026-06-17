import api from './api';

export const focusService = {
  // 获取专注配置
  getFocusSettings: async (studentId) => {
    const response = await api.get(`/focus/settings/${studentId}`);
    return response.settings;
  },

  // 更新专注配置
  updateFocusSettings: async (studentId, data) => {
    const response = await api.put(`/focus/settings/${studentId}`, data);
    return response.settings;
  },

  // 强制学生专注
  forceFocus: async (data) => {
    const response = await api.post('/focus/sessions/force', data);
    return response.session;
  },

  // 获取专注记录
  getFocusSessions: async (params = {}) => {
    const response = await api.get('/focus/sessions', { params });
    return response.sessions;
  },
};
