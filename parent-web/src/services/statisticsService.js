import api from './api';

export const statisticsService = {
  // 获取学习统计
  getStatistics: async (studentId, params = {}) => {
    const response = await api.get(`/statistics/${studentId}`, { params });
    return response.statistics;
  },

  // 获取今日统计
  getTodayStatistics: async (studentId) => {
    const response = await api.get(`/statistics/today/${studentId}`);
    return response.statistics;
  },

  // 获取周统计
  getWeekStatistics: async (studentId) => {
    const response = await api.get(`/statistics/week/${studentId}`);
    return response.statistics;
  },

  // 获取月统计
  getMonthStatistics: async (studentId) => {
    const response = await api.get(`/statistics/month/${studentId}`);
    return response.statistics;
  },
};
