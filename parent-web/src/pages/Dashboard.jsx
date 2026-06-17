import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Avatar, Dropdown } from 'antd';
import { 
  HomeOutlined, 
  BookOutlined, 
  UserOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { homeworkService } from '../services/homeworkService';

const { Header, Content, Sider } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState({
    totalHomework: 0,
    completedHomework: 0,
    inProgressHomework: 0,
    overdueHomework: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUserData();
    loadStudents();
  }, []);

  const loadUserData = () => {
    const userData = authService.getLocalUser();
    setUser(userData);
  };

  const loadStudents = async () => {
    try {
      const studentsData = await userService.getMyStudents();
      setStudents(studentsData || []);
      
      // 加载统计数据
      if (studentsData && studentsData.length > 0) {
        const homeworks = await homeworkService.getHomeworkList({ 
          student_id: studentsData[0].student_id 
        });
        setStatistics({
          totalHomework: homeworks?.length || 0,
          completedHomework: homeworks?.filter(h => h.status === 'completed')?.length || 0,
          inProgressHomework: homeworks?.filter(h => h.status === 'in_progress')?.length || 0,
          overdueHomework: homeworks?.filter(h => h.status === 'overdue')?.length || 0,
        });
      }
    } catch (error) {
      console.error('加载学生数据失败:', error);
      // 即使失败也不影响页面显示
      setStudents([]);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/homework',
      icon: <BookOutlined />,
      label: '作业管理',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '数据统计',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={styles.logo}>
          <h2 style={{ color: 'white', textAlign: 'center', padding: '16px' }}>
            {collapsed ? '作业' : '作业自律助手'}
          </h2>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={styles.header}>
          <div style={styles.headerContent}>
            <h2 style={{ color: 'white', margin: 0 }}>家长管理端</h2>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={styles.userInfo}>
                <Avatar icon={<UserOutlined />} style={styles.avatar} />
                <span style={{ color: 'white', marginLeft: 8 }}>
                  {user?.nickname || '家长'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={styles.content}>
          <div style={styles.contentInner}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总作业数"
                    value={statistics.totalHomework}
                    prefix={<BookOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={statistics.completedHomework}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="进行中"
                    value={statistics.inProgressHomework}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已超时"
                    value={statistics.overdueHomework}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card 
              title="我的学生" 
              style={{ marginTop: 16 }}
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/settings')}
                >
                  添加学生
                </Button>
              }
            >
              {students.length === 0 ? (
                <p>暂无绑定的学生，请先添加学生设备</p>
              ) : (
                <Row gutter={[16, 16]}>
                  {students.map((student) => (
                    <Col span={8} key={student.id}>
                      <Card
                        hoverable
                        onClick={() => navigate(`/student/${student.student_id}`)}
                        style={styles.studentCard}
                      >
                        <div style={styles.studentInfo}>
                          <Avatar 
                            size={64} 
                            icon={<UserOutlined />} 
                            src={student.avatar_url}
                          />
                          <div style={styles.studentDetails}>
                            <h3>{student.nickname}</h3>
                            <p style={{ color: '#999' }}>{student.device_name}</p>
                            <p style={{ color: '#999' }}>{student.device_type}</p>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const styles = {
  logo: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    background: '#001529',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  avatar: {
    backgroundColor: '#1890ff',
  },
  content: {
    margin: '24px 16px',
    padding: 24,
    minHeight: 280,
    background: '#fff',
    borderRadius: 8,
  },
  contentInner: {
    padding: 24,
  },
  studentCard: {
    textAlign: 'center',
  },
  studentInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  studentDetails: {
    marginTop: 12,
  },
};

export default Dashboard;
