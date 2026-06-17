import api from './api';

export const homeworkService = {
  // 获取作业列表
  getHomeworkList: async (params = {}) => {
    const response = await api.get('/homework', { params });
    return response.homeworks;
  },

  // 获取作业详情
  getHomeworkDetail: async (id) => {
    const response = await api.get(`/homework/${id}`);
    return response.homework;
  },

  // 更新作业状态
  updateHomeworkStatus: async (id, status) => {
    const response = await api.patch(`/homework/${id}/status`, { status });
    return response.homework;
  },

  // 获取今日作业统计
  getTodayStatistics: async () => {
    const response = await api.get('/homework', {
      params: {
        date: new Date().toISOString().split('T')[0],
      },
    });
    const homeworks = response.homeworks;
    return {
      total: homeworks.length,
      completed: homeworks.filter(h => h.status === 'completed').length,
      inProgress: homeworks.filter(h => h.status === 'in_progress').length,
      notStarted: homeworks.filter(h => h.status === 'not_started').length,
      overdue: homeworks.filter(h => h.status === 'overdue').length,
    };
  },
};
