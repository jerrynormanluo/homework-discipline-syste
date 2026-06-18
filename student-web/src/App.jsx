import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, List, Tag, Typography, message, Statistic, Row, Col, Progress, Modal, Form, Input, Select, DatePicker } from 'antd';
import { BookOutlined, ClockCircleOutlined, TrophyOutlined, LogoutOutlined, CheckCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend-five-indol-51.vercel.app';

const StudentWebApp = () => {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('homework');
  const [homeworks, setHomeworks] = useState([]);
  const [points, setPoints] = useState(0);
  const [focusConfig, setFocusConfig] = useState(null);
  const [loginForm] = Form.useForm();

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (token && !user) {
      // 如果有token但没有用户信息，尝试加载（但不强制logout）
      loadUserData();
    }
  }, []);

  // 加载用户数据（不强制logout）
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('student_token');
      // 使用正确的API路径 /api/auth/me
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data.user);
      loadHomeworks();
      loadPoints();
      loadFocusConfig();
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 只有在明确是401未授权时才logout
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const loadHomeworks = async () => {
    try {
      const token = localStorage.getItem('student_token');
      const response = await axios.get(`${API_BASE_URL}/api/homework/my-homeworks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHomeworks(response.data.homeworks || []);
    } catch (error) {
      console.error('加载作业失败:', error);
    }
  };

  const loadPoints = async () => {
    try {
      const token = localStorage.getItem('student_token');
      const response = await axios.get(`${API_BASE_URL}/api/points/my-points`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPoints(response.data.total_points || 0);
    } catch (error) {
      console.error('加载积分失败:', error);
    }
  };

  const loadFocusConfig = async () => {
    try {
      const token = localStorage.getItem('student_token');
      const response = await axios.get(`${API_BASE_URL}/api/focus/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFocusConfig(response.data.config);
    } catch (error) {
      console.error('加载专注配置失败:', error);
    }
  };

  const handleLogin = async (values) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, values);
      localStorage.setItem('student_token', response.data.token);
      
      // 直接使用登录返回的用户信息
      setUser(response.data.user);
      message.success('登录成功');
      
      // 加载其他数据
      loadHomeworks();
      loadPoints();
      loadFocusConfig();
    } catch (error) {
      console.error('登录失败:', error);
      message.error(error.response?.data?.message || '登录失败');
    }
  };

  const logout = () => {
    localStorage.removeItem('student_token');
    setUser(null);
    setHomeworks([]);
    setPoints(0);
    message.info('已退出登录');
  };

  const completeHomework = async (homeworkId) => {
    try {
      const token = localStorage.getItem('student_token');
      await axios.put(`${API_BASE_URL}/api/homework/${homeworkId}`, 
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      message.success('作业已完成');
      loadHomeworks();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 登录页面
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Card title="学生端登录" style={{ width: 400 }}>
          <Form form={loginForm} onFinish={handleLogin}>
            <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
              <Input placeholder="手机号" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>登录</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  // 主界面
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light">
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Title level={4}>{user?.nickname}</Title>
          <Text type="secondary">{user?.phone}</Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentTab]}
          onClick={({ key }) => setCurrentTab(key)}
          items={[
            { key: 'homework', icon: <BookOutlined />, label: '我的作业' },
            { key: 'focus', icon: <ClockCircleOutlined />, label: '专注模式' },
            { key: 'points', icon: <TrophyOutlined />, label: '积分中心' },
          ]}
        />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
          <Button icon={<LogoutOutlined />} onClick={logout} block danger>
            退出登录
          </Button>
        </div>
      </Sider>
      
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>
            {currentTab === 'homework' && '我的作业'}
            {currentTab === 'focus' && '专注模式'}
            {currentTab === 'points' && '积分中心'}
          </Title>
          <Statistic title="当前积分" value={points} prefix={<TrophyOutlined />} valueStyle={{ color: '#faad14' }} />
        </Header>
        
        <Content style={{ margin: 24 }}>
          {currentTab === 'homework' && (
            <List
              dataSource={homeworks}
              renderItem={(item) => (
                <List.Item>
                  <Card style={{ width: '100%' }} title={item.title} extra={
                    <Tag color={item.status === 'completed' ? 'green' : 'blue'}>
                      {item.status === 'completed' ? '已完成' : '未完成'}
                    </Tag>
                  }>
                    <p>{item.content}</p>
                    <p><Text type="secondary">学科: {item.subject}</Text></p>
                    <p><Text type="secondary">截止日期: {dayjs(item.deadline).format('YYYY-MM-DD')}</Text></p>
                    {item.status !== 'completed' && (
                      <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => completeHomework(item.id)}
                      >
                        标记完成
                      </Button>
                    )}
                  </Card>
                </List.Item>
              )}
            />
          )}

          {currentTab === 'focus' && (
            <Card title="专注模式">
              <p>专注模式可以帮助您集中注意力完成作业。</p>
              {focusConfig && (
                <div>
                  <p>建议时长: {focusConfig.default_duration || 25} 分钟</p>
                  <Button type="primary" icon={<PlayCircleOutlined />} size="large">
                    开始专注
                  </Button>
                </div>
              )}
            </Card>
          )}

          {currentTab === 'points' && (
            <Card title="积分中心">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="总积分" value={points} suffix="分" />
                </Col>
              </Row>
              <div style={{ marginTop: 24 }}>
                <Title level={4}>积分规则</Title>
                <ul>
                  <li>完成作业: +10分</li>
                  <li>按时完成: +5分</li>
                  <li>专注学习: +20分/小时</li>
                </ul>
              </div>
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentWebApp;
