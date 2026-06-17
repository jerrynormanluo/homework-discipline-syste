import api from './api';

export const focusService = {
  // 获取专注配置
  getFocusSettings: async (studentId) => {
    const response = await api.get(`/focus/settings/${studentId}`);
    return response.settings;
  },

  // 开始专注
  startFocus: async (homeworkId, plannedDuration) => {
    const response = await api.post('/focus/sessions', {
      homework_id: homeworkId,
      planned_duration: plannedDuration,
    });
    return response.session;
  },

  // 结束专注
  endFocus: async (sessionId) => {
    const response = await api.put(`/focus/sessions/${sessionId}/end`);
    return response.session;
  },

  // 获取专注记录
  getFocusSessions: async (params = {}) => {
    const response = await api.get('/focus/sessions', { params });
    return response.sessions;
  },

  // 获取今日专注统计
  getTodayStatistics: async () => {
    const response = await api.get('/focus/statistics/today');
    return response.statistics;
  },
};
