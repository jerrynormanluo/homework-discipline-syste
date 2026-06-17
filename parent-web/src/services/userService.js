import api from './api';

export const userService = {
  // 绑定学生设备
  bindStudent: async (data) => {
    const response = await api.post('/users/bind-student', data);
    return response;
  },

  // 获取绑定的学生列表
  getMyStudents: async () => {
    const response = await api.get('/users/my-students');
    return response.students;
  },

  // 获取学生设备配置
  getDeviceSettings: async (studentId) => {
    const response = await api.get(`/users/device-settings/${studentId}`);
    return response;
  },

  // 更新学生设备配置
  updateDeviceSettings: async (studentId, data) => {
    const response = await api.put(`/users/device-settings/${studentId}`, data);
    return response;
  },

  // 解绑学生
  unbindStudent: async (studentId) => {
    const response = await api.delete(`/users/unbind-student/${studentId}`);
    return response;
  },
};
