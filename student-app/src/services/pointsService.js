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

  // 获取奖励列表
  getRewards: async (studentId) => {
    const response = await api.get(`/points/rewards/${studentId}`);
    return response.rewards;
  },

  // 兑换奖励
  redeemReward: async (rewardId) => {
    const response = await api.post('/points/redeem', { reward_id: rewardId });
    return response.redemption;
  },
};
