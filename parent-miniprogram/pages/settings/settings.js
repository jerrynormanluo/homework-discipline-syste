// pages/settings/settings.js
const app = getApp();

Page({
  data: {
    userInfo: null
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo
    });
  },

  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo
    });
  },

  bindStudent() {
    wx.showToast({
      title: '添加学生功能开发中',
      icon: 'none'
    });
  },

  manageStudents() {
    wx.showToast({
      title: '学生管理功能开发中',
      icon: 'none'
    });
  },

  notificationSettings() {
    wx.showToast({
      title: '通知设置功能开发中',
      icon: 'none'
    });
  },

  privacySettings() {
    wx.showToast({
      title: '隐私设置功能开发中',
      icon: 'none'
    });
  },

  about() {
    wx.showModal({
      title: '关于我们',
      content: '青少年作业自律辅助系统 v1.0.0\n培养孩子作业自律性，降低家长监督成本',
      showCancel: false
    });
  },

  help() {
    wx.showToast({
      title: '帮助中心功能开发中',
      icon: 'none'
    });
  },

  feedback() {
    wx.showToast({
      title: '意见反馈功能开发中',
      icon: 'none'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginInfo();
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});
