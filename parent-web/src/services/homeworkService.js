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

  // 创建作业
  createHomework: async (data) => {
    const response = await api.post('/homework', data);
    return response.homework;
  },

  // 批量创建作业
  batchCreateHomework: async (homeworks) => {
    const response = await api.post('/homework/batch', { homeworks });
    return response.homeworks;
  },

  // 更新作业
  updateHomework: async (id, data) => {
    const response = await api.put(`/homework/${id}`, data);
    return response.homework;
  },

  // 删除作业
  deleteHomework: async (id) => {
    const response = await api.delete(`/homework/${id}`);
    return response;
  },

  // 清空已完成作业
  clearCompletedHomework: async (studentId) => {
    const response = await api.delete('/homework/completed/clear', {
      params: { student_id: studentId }
    });
    return response;
  },

  // 获取作业模板
  getTemplates: async () => {
    const response = await api.get('/homework/templates');
    return response.templates;
  },

  // 保存作业模板
  saveTemplate: async (data) => {
    const response = await api.post('/homework/templates', data);
    return response.template;
  },
};
