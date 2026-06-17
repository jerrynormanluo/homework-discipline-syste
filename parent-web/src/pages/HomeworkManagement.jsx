import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message, 
  Card, 
  Space,
  Tag,
  Popconfirm,
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeworkService } from '../services/homeworkService';
import { userService } from '../services/userService';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const HomeworkManagement = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
    loadHomeworks();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await userService.getMyStudents();
      setStudents(data);
    } catch (error) {
      message.error('加载学生列表失败');
    }
  };

  const loadHomeworks = async () => {
    setLoading(true);
    try {
      const data = await homeworkService.getHomeworkList();
      setHomeworks(data);
    } catch (error) {
      message.error('加载作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingHomework(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (homework) => {
    setEditingHomework(homework);
    form.setFieldsValue({
      ...homework,
      deadline: homework.deadline ? dayjs(homework.deadline) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await homeworkService.deleteHomework(id);
      message.success('删除成功');
      loadHomeworks();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        deadline: values.deadline ? values.deadline.toISOString() : null,
      };

      if (editingHomework) {
        await homeworkService.updateHomework(editingHomework.id, submitData);
        message.success('更新成功');
      } else {
        console.log('创建作业数据:', submitData);
        await homeworkService.createHomework(submitData);
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadHomeworks();
    } catch (error) {
      console.error('操作失败:', error);
      message.error(error.error || error.message || '操作失败，请检查输入是否正确');
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

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'green',
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => {
        const texts = {
          school: '校内作业',
          extra: '加餐作业',
          recitation: '背诵任务',
          wrong_questions: '错题整理',
          reading: '课外阅读',
        };
        return texts[category] || category;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 180,
      render: (deadline) => dayjs(deadline).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '预计耗时',
      dataIndex: 'estimated_duration',
      key: 'estimated_duration',
      width: 100,
      render: (duration) => duration ? `${duration}分钟` : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/student/${record.student_id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#fff' }}>
        <Card
          title="作业管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建作业
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={homeworks}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Card>

        <Modal
          title={editingHomework ? '编辑作业' : '创建作业'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="student_id"
              label="学生"
              rules={[{ required: true, message: '请选择学生' }]}
            >
              <Select placeholder="请选择学生">
                {students.map((student) => (
                  <Option key={student.student_id} value={student.student_id}>
                    {student.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="title"
              label="作业标题"
              rules={[{ required: true, message: '请输入作业标题' }]}
            >
              <Input placeholder="请输入作业标题" />
            </Form.Item>

            <Form.Item
              name="subject"
              label="学科"
              rules={[{ required: true, message: '请输入学科' }]}
            >
              <Input placeholder="请输入学科" />
            </Form.Item>

            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类">
                <Option value="school">校内作业</Option>
                <Option value="extra">加餐作业</Option>
                <Option value="recitation">背诵任务</Option>
                <Option value="wrong_questions">错题整理</Option>
                <Option value="reading">课外阅读</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="content"
              label="作业内容"
            >
              <TextArea rows={4} placeholder="请输入作业内容" />
            </Form.Item>

            <Form.Item
              name="estimated_duration"
              label="预计耗时（分钟）"
            >
              <Input type="number" placeholder="请输入预计耗时" />
            </Form.Item>

            <Form.Item
              name="deadline"
              label="截止时间"
              rules={[{ required: true, message: '请选择截止时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="请选择优先级">
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingHomework ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default HomeworkManagement;
