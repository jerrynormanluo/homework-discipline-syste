import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Spin } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import { userService } from '../services/userService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Statistics = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStatistics();
    }
  }, [selectedStudent, dateRange]);

  const loadStudents = async () => {
    try {
      const data = await userService.getMyStudents();
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudent(data[0].student_id);
      }
    } catch (error) {
      console.error('加载学生列表失败:', error);
    }
  };

  const loadStatistics = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const data = await statisticsService.getStatistics(selectedStudent, {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      setStatistics(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 准备图表数据
  const prepareChartData = () => {
    if (!statistics || statistics.length === 0) return [];

    return statistics.map(stat => ({
      date: dayjs(stat.stat_date).format('MM-DD'),
      completed: stat.completed_homework,
      overdue: stat.overdue_homework,
      focusDuration: stat.total_focus_duration,
      pointsEarned: stat.points_earned,
      pointsDeducted: -stat.points_deducted,
    }));
  };

  const prepareSubjectDistribution = () => {
    if (!statistics || statistics.length === 0) return [];

    // 汇总学科分布
    const subjectData = {};
    statistics.forEach(stat => {
      if (stat.subject_distribution) {
        Object.entries(stat.subject_distribution).forEach(([subject, value]) => {
          subjectData[subject] = (subjectData[subject] || 0) + value;
        });
      }
    });

    return Object.entries(subjectData).map(([name, value]) => ({
      name: name,
      value: value,
    }));
  };

  const chartData = prepareChartData();
  const subjectData = prepareSubjectDistribution();

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card title="数据统计" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>选择学生:</span>
            <Select
              style={{ width: 200 }}
              value={selectedStudent}
              onChange={setSelectedStudent}
              placeholder="请选择学生"
            >
              {students.map(student => (
                <Option key={student.student_id} value={student.student_id}>
                  {student.nickname}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={loadStatistics}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="作业完成趋势">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#00C49F" name="已完成" />
                  <Line type="monotone" dataKey="overdue" stroke="#FF8042" name="超时" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="专注时长趋势">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="focusDuration" fill="#8884D8" name="专注时长(分钟)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="积分变动趋势">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pointsEarned" fill="#00C49F" name="获得积分" />
                  <Bar dataKey="pointsDeducted" fill="#FF8042" name="扣除积分" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {subjectData.length > 0 && (
            <Col span={12}>
              <Card title="学科学习分布">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}

          <Col span={12}>
            <Card title="统计摘要">
              {statistics.length > 0 && (
                <div>
                  <p><strong>统计期间:</strong> {dateRange[0].format('YYYY-MM-DD')} 至 {dateRange[1].format('YYYY-MM-DD')}</p>
                  <p><strong>总作业数:</strong> {statistics.reduce((sum, s) => sum + s.total_homework, 0)}</p>
                  <p><strong>已完成:</strong> {statistics.reduce((sum, s) => sum + s.completed_homework, 0)}</p>
                  <p><strong>超时:</strong> {statistics.reduce((sum, s) => sum + s.overdue_homework, 0)}</p>
                  <p><strong>总专注时长:</strong> {statistics.reduce((sum, s) => sum + s.total_focus_duration, 0)} 分钟</p>
                  <p><strong>获得积分:</strong> {statistics.reduce((sum, s) => sum + s.points_earned, 0)}</p>
                  <p><strong>扣除积分:</strong> {statistics.reduce((sum, s) => sum + s.points_deducted, 0)}</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Statistics;
