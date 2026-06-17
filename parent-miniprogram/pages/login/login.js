// pages/login/login.js
const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.token) {
      wx.redirectTo({
        url: '/pages/index/index'
      });
    }
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  handleLogin() {
    const { phone, password } = this.data;

    if (!phone || !password) {
      wx.showToast({
        title: '请输入手机号和密码',
        icon: 'none'
      });
      return;
    }

    if (phone.length !== 11) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    app.request({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password }
    }).then(res => {
      app.setLoginInfo(res.token, res.user);
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/index/index'
        });
      }, 1500);
    }).catch(err => {
      wx.showToast({
        title: err.error || '登录失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
});
