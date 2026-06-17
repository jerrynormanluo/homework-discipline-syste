// pages/homework/homework.js
const app = getApp();

Page({
  data: {
    students: [],
    selectedStudent: null,
    selectedStudentId: null,
    statusOptions: ['全部状态', '未开始', '进行中', '已完成', '已超时'],
    selectedStatus: 0,
    homeworks: [],
    loading: false
  },

  onLoad() {
    this.loadStudents();
  },

  onShow() {
    if (this.data.selectedStudentId) {
      this.loadHomeworks();
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
        this.loadHomeworks();
      }
    }).catch(err => {
      console.error('加载学生列表失败:', err);
    });
  },

  loadHomeworks() {
    if (!this.data.selectedStudentId) return;

    this.setData({ loading: true });

    const params = { student_id: this.data.selectedStudentId };
    if (this.data.selectedStatus > 0) {
      const statusMap = ['', 'not_started', 'in_progress', 'completed', 'overdue'];
      params.status = statusMap[this.data.selectedStatus];
    }

    app.request({
      url: '/homework',
      data: params
    }).then(res => {
      this.setData({
        homeworks: res.homeworks
      });
    }).catch(err => {
      console.error('加载作业列表失败:', err);
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  onStudentChange(e) {
    const index = e.detail.value;
    this.setData({
      selectedStudent: this.data.students[index],
      selectedStudentId: this.data.students[index].student_id
    });
    this.loadHomeworks();
  },

  onStatusChange(e) {
    this.setData({
      selectedStatus: e.detail.value
    });
    this.loadHomeworks();
  },

  createHomework() {
    if (!this.data.selectedStudentId) {
      wx.showToast({
        title: '请先选择学生',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/homework-create/homework-create?studentId=${this.data.selectedStudentId}`
    });
  },

  viewHomework(e) {
    const homeworkId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/homework-detail/homework-detail?id=${homeworkId}`
    });
  },

  editHomework(e) {
    const homeworkId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/homework-edit/homework-edit?id=${homeworkId}`
    });
  },

  deleteHomework(e) {
    const homeworkId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个作业吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(homeworkId);
        }
      }
    });
  },

  performDelete(homeworkId) {
    app.request({
      url: `/homework/${homeworkId}`,
      method: 'DELETE'
    }).then(() => {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      this.loadHomeworks();
    }).catch(err => {
      wx.showToast({
        title: err.error || '删除失败',
        icon: 'none'
      });
    });
  },

  getPriorityClass(priority) {
    const classes = {
      high: 'tag-danger',
      medium: 'tag-warning',
      low: 'tag-success'
    };
    return classes[priority] || 'tag-primary';
  },

  getPriorityText(priority) {
    const texts = { high: '高', medium: '中', low: '低' };
    return texts[priority] || priority;
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
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
});
