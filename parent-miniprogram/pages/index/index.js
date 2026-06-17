// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    students: [],
    statistics: {
      totalHomework: 0,
      completedHomework: 0,
      inProgressHomework: 0,
      overdueHomework: 0
    }
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (app.globalData.token) {
      this.loadData();
    }
  },

  checkLogin() {
    if (!app.globalData.token) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    } else {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      this.loadData();
    }
  },

  loadData() {
    this.loadStudents();
    this.loadStatistics();
  },

  loadStudents() {
    app.request({
      url: '/users/my-students'
    }).then(res => {
      this.setData({
        students: res.students
      });
      if (res.students.length > 0) {
        this.loadHomeworkStatistics(res.students[0].student_id);
      }
    }).catch(err => {
      console.error('加载学生列表失败:', err);
    });
  },

  loadHomeworkStatistics(studentId) {
    app.request({
      url: '/homework',
      data: { student_id: studentId }
    }).then(res => {
      const homeworks = res.homeworks;
      this.setData({
        statistics: {
          totalHomework: homeworks.length,
          completedHomework: homeworks.filter(h => h.status === 'completed').length,
          inProgressHomework: homeworks.filter(h => h.status === 'in_progress').length,
          overdueHomework: homeworks.filter(h => h.status === 'overdue').length
        }
      });
    }).catch(err => {
      console.error('加载作业统计失败:', err);
    });
  },

  loadStatistics() {
    // 可以加载更详细的统计数据
  },

  goToStudentDetail(e) {
    const studentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/student/student?id=${studentId}`
    });
  },

  goToHomework() {
    wx.switchTab({
      url: '/pages/homework/homework'
    });
  },

  goToStatistics() {
    wx.switchTab({
      url: '/pages/statistics/statistics'
    });
  },

  goToSettings() {
    wx.switchTab({
      url: '/pages/settings/settings'
    });
  }
});
