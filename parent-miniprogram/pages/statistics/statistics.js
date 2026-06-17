// pages/statistics/statistics.js
const app = getApp();

Page({
  data: {
    students: [],
    selectedStudent: null,
    selectedStudentId: null,
    periodOptions: ['今日', '本周', '本月'],
    selectedPeriod: 0,
    statistics: [],
    overview: {
      totalHomework: 0,
      completedHomework: 0,
      totalFocusDuration: 0,
      pointsEarned: 0
    }
  },

  onLoad() {
    this.loadStudents();
  },

  onShow() {
    if (this.data.selectedStudentId) {
      this.loadStatistics();
    }
  },

  loadStudents() {
    app.request({
      url: '/users/my-students'
    }).then(res => {
      this.setData({
        students: res.students
      });
      if (res.students.length > 0) {
        this.setData({
          selectedStudent: res.students[0],
          selectedStudentId: res.students[0].student_id
        });
        this.loadStatistics();
      }
    }).catch(err => {
      console.error('加载学生列表失败:', err);
    });
  },

  loadStatistics() {
    if (!this.data.selectedStudentId) return;

    let url = '';
    const period = this.data.selectedPeriod;

    if (period === 0) {
      url = '/statistics/today/' + this.data.selectedStudentId;
    } else if (period === 1) {
      url = '/statistics/week/' + this.data.selectedStudentId;
    } else {
      url = '/statistics/month/' + this.data.selectedStudentId;
    }

    app.request({
      url: url
    }).then(res => {
      const stats = Array.isArray(res.statistics) ? res.statistics : [res.statistics];
      this.setData({
        statistics: stats
      });
      this.calculateOverview(stats);
    }).catch(err => {
      console.error('加载统计数据失败:', err);
    });
  },

  calculateOverview(stats) {
    const overview = {
      totalHomework: 0,
      completedHomework: 0,
      totalFocusDuration: 0,
      pointsEarned: 0
    };

    stats.forEach(stat => {
      overview.totalHomework += stat.total_homework || 0;
      overview.completedHomework += stat.completed_homework || 0;
      overview.totalFocusDuration += stat.total_focus_duration || 0;
      overview.pointsEarned += stat.points_earned || 0;
    });

    this.setData({ overview });
  },

  onStudentChange(e) {
    const index = e.detail.value;
    this.setData({
      selectedStudent: this.data.students[index],
      selectedStudentId: this.data.students[index].student_id
    });
    this.loadStatistics();
  },

  onPeriodChange(e) {
    this.setData({
      selectedPeriod: e.detail.value
    });
    this.loadStatistics();
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
});
