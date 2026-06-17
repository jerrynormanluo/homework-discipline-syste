// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000/api', // 开发环境
    // baseUrl: 'https://your-production-api.com/api', // 生产环境
  },

  onLaunch() {
    // 检查登录状态
    this.checkLogin();
  },

  onShow() {
    // 小程序显示
  },

  onHide() {
    // 小程序隐藏
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  // 设置登录信息
  setLoginInfo(token, userInfo) {
    this.globalData.token = token;
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
  },

  // 清除登录信息
  clearLoginInfo() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  // 网络请求封装
  request(options) {
    const { url, method = 'GET', data = {}, header = {} } = options;
    
    // 添加token
    if (this.globalData.token) {
      header.Authorization = `Bearer ${this.globalData.token}`;
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // Token过期，清除登录信息
            this.clearLoginInfo();
            wx.redirectTo({
              url: '/pages/login/login'
            });
            reject({ error: '登录已过期，请重新登录' });
          } else {
            reject(res.data || { error: '请求失败' });
          }
        },
        fail: (err) => {
          reject({ error: '网络请求失败' });
        }
      });
    });
  }
});
