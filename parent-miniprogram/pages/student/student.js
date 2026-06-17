// pages/student/student.js
const app = getApp();

Page({
  data: {
    studentId: null,
    student: {},
    statistics: {
      totalHomework: 0,
      completedHomework: 0,
      inProgressHomework: 0,
      overdueHomework: 0
    },
    recentHomeworks: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ studentId: options.id });
      this.loadStudentData();
    }
  },

  loadStudentData() {
    this.loadStudentInfo();
    this.loadStatistics();
    this.loadRecentHomeworks();
  },

  loadStudentInfo() {
    app.request({
      url: '/users/my-students'
    }).then(res => {
      const student = res.students.find(s => s.student_id === parseInt(this.data.studentId));
      if (student) {
        this.setData({ student });
      }
    }).catch(err => {
      console.error('加载学生信息失败:', err);
    });
  },

  loadStatistics() {
    app.request({
      url: '/statistics/today/' + this.data.studentId
    }).then(res => {
      if (res.statistics) {
        this.setData({
          statistics: {
            totalHomework: res.statistics.total_homework || 0,
            completedHomework: res.statistics.completed_homework || 0,
            inProgressHomework: res.statistics.in_progress_homework || 0,
            overdueHomework: res.statistics.overdue_homework || 0
          }
        });
      }
    }).catch(err => {
      console.error('加载统计数据失败:', err);
    });
  },

  loadRecentHomeworks() {
    app.request({
      url: '/homework',
      data: { student_id: this.data.studentId, limit: 5 }
    }).then(res => {
      this.setData({
        recentHomeworks: res.homeworks
      });
    }).catch(err => {
      console.error('加载作业列表失败:', err);
    });
  },

  forceFocus() {
    wx.showModal({
      title: '强制专注',
      content: '请输入专注时长（分钟）',
      editable: true,
      placeholderText: '25',
      success: (res) => {
        if (res.confirm && res.content) {
          const duration = parseInt(res.content);
          if (duration > 0) {
            this.performForceFocus(duration);
          } else {
            wx.showToast({
              title: '请输入有效的时长',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  performForceFocus(duration) {
    app.request({
      url: '/focus/sessions/force',
      method: 'POST',
      data: {
        student_id: parseInt(this.data.studentId),
        planned_duration: duration
      }
    }).then(() => {
      wx.showToast({
        title: '专注模式已下发',
        icon: 'success'
      });
    }).catch(err => {
      wx.showToast({
        title: err.error || '下发失败',
        icon: 'none'
      });
    });
  },

  viewHomework() {
    wx.switchTab({
      url: '/pages/homework/homework'
    });
  },

  viewPoints() {
    wx.showToast({
      title: '积分记录功能开发中',
      icon: 'none'
    });
  },

  getStatusClass(status) {
    const classes = {
      not_started: 'tag-secondary',
      in_progress: 'tag-primary',
      completed: 'tag-success',
      overdue: 'tag-danger'
    };
    return classes[status] || 'tag-secondary';
  },

  getStatusText(status) {
    const texts = {
      not_started: '未开始',
      in_progress: '进行中',
      completed: '已完成',
      overdue: '已超时'
    };
    return texts[status] || status;
  }
});
