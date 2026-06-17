import api from './api';

export const pointsService = {
  // 获取积分余额
  getBalance: async (studentId) => {
    const response = await api.get(`/points/balance/${studentId}`);
    return response.balance;
  },

  // 获取积分记录
  getRecords: async (studentId, limit = 50) => {
    const response = await api.get(`/points/records/${studentId}`, {
      params: { limit },
    });
    return response.records;
  },

  // 手动添加/扣除积分
  manualPoints: async (data) => {
    const response = await api.post('/points/manual', data);
    return response.record;
  },

  // 创建积分规则
  createRule: async (data) => {
    const response = await api.post('/points/rules', data);
    return response.rule;
  },

  // 获取积分规则
  getRules: async (studentId) => {
    const response = await api.get(`/points/rules/${studentId}`);
    return response.rules;
  },

  // 创建奖励
  createReward: async (data) => {
    const response = await api.post('/points/rewards', data);
    return response.reward;
  },

  // 获取奖励列表
  getRewards: async (studentId) => {
    const response = await api.get(`/points/rewards/${studentId}`);
    return response.rewards;
  },

  // 审核兑换申请
  approveRedemption: async (id, status) => {
    const response = await api.put(`/points/redeem/${id}/approve`, { status });
    return response.redemption;
  },
};
