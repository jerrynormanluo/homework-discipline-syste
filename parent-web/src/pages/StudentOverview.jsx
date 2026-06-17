import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Tabs, 
  Table, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  Descriptions,
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  EditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { homeworkService } from '../services/homeworkService';
import { focusService } from '../services/focusService';
import { pointsService } from '../services/pointsService';
import { statisticsService } from '../services/statisticsService';
import dayjs from 'dayjs';

const StudentOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [pointRecords, setPointRecords] = useState([]);
  const [balance, setBalance] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [focusModalVisible, setFocusModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStudentData();
  }, [id]);

  const loadStudentData = async () => {
    try {
      // 加载作业列表
      const homeworkData = await homeworkService.getHomeworkList({ student_id: id });
      setHomeworks(homeworkData);

      // 加载专注记录
      const focusData = await focusService.getFocusSessions({ student_id: id });
      setFocusSessions(focusData);

      // 加载积分记录
      const pointData = await pointsService.getRecords(id, 20);
      setPointRecords(pointData);

      // 加载积分余额
      const balanceData = await pointsService.getBalance(id);
      setBalance(balanceData);

      // 加载统计数据
      const statsData = await statisticsService.getTodayStatistics(id);
      setStatistics(statsData);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleForceFocus = async (values) => {
    try {
      await focusService.forceFocus({
        student_id: parseInt(id),
        planned_duration: values.duration,
      });
      message.success('专注模式已下发');
      setFocusModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('下发失败');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'default',
      in_progress: 'processing',
      completed: 'success',
      overdue: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      not_started: '未开始',
      in_progress: '进行中',
      completed: '已完成',
      overdue: '已超时',
    };
    return texts[status] || status;
  };

  const homeworkColumns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) => dayjs(deadline).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const focusColumns = [
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '计划时长',
      dataIndex: 'planned_duration',
      key: 'planned_duration',
      render: (duration) => `${duration}分钟`,
    },
    {
      title: '实际时长',
      dataIndex: 'actual_duration',
      key: 'actual_duration',
      render: (duration) => duration ? `${duration}分钟` : '-',
    },
    {
      title: '状态',
      dataIndex: 'is_completed',
      key: 'is_completed',
      render: (completed) => (
        <Tag color={completed ? 'success' : 'processing'}>
          {completed ? '已完成' : '进行中'}
        </Tag>
      ),
    },
  ];

  const pointColumns = [
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '积分变动',
      dataIndex: 'points_change',
      key: 'points_change',
      render: (change) => (
        <span style={{ color: change > 0 ? '#52c41a' : '#ff4d4f' }}>
          {change > 0 ? '+' : ''}{change}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const tabItems = [
    {
      key: 'homework',
      label: '作业列表',
      children: (
        <Table
          columns={homeworkColumns}
          dataSource={homeworks}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'focus',
      label: '专注记录',
      children: (
        <Table
          columns={focusColumns}
          dataSource={focusSessions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'points',
      label: '积分记录',
      children: (
        <Table
          columns={pointColumns}
          dataSource={pointRecords}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回首页
      </Button>

      <Card title="学生概览" style={{ marginBottom: 16 }}>
        <Descriptions column={4}>
          <Descriptions.Item label="学生ID">{id}</Descriptions.Item>
          <Descriptions.Item label="当前积分">{balance}</Descriptions.Item>
          {statistics && (
            <>
              <Descriptions.Item label="今日作业">{statistics.total_homework}</Descriptions.Item>
              <Descriptions.Item label="今日专注">{statistics.total_focus_duration}分钟</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总作业数"
              value={homeworks.length}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={homeworks.filter(h => h.status === 'completed').length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={homeworks.filter(h => h.status === 'in_progress').length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已超时"
              value={homeworks.filter(h => h.status === 'overdue').length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="学生详情"
        extra={
          <Button 
            type="primary" 
            icon={<ClockCircleOutlined />}
            onClick={() => setFocusModalVisible(true)}
          >
            强制专注
          </Button>
        }
      >
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="强制专注模式"
        open={focusModalVisible}
        onCancel={() => setFocusModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleForceFocus} layout="vertical">
          <Form.Item
            name="duration"
            label="专注时长（分钟）"
            rules={[{ required: true, message: '请输入专注时长' }]}
          >
            <Input type="number" placeholder="请输入专注时长" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              下发专注模式
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentOverview;
