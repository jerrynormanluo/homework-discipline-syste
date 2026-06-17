import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Table, 
  Modal, 
  message, 
  Tabs, 
  Switch, 
  Slider,
  Select,
  Popconfirm,
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
} from '@ant-design/icons';
import { userService } from '../services/userService';
import { focusService } from '../services/focusService';
import { pointsService } from '../services/pointsService';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const [students, setStudents] = useState([]);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSettings, setStudentSettings] = useState(null);
  const [pointRules, setPointRules] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      console.log('加载学生列表...');
      const data = await userService.getMyStudents();
      console.log('学生数据:', data);
      setStudents(data || []);
    } catch (error) {
      console.error('加载学生列表失败:', error);
      message.error('加载学生列表失败: ' + (error.error || error.message));
      setStudents([]);
    }
  };

  const handleBindStudent = async (values) => {
    try {
      console.log('绑定学生:', values);
      await userService.bindStudent(values);
      message.success('绑定成功');
      setBindModalVisible(false);
      form.resetFields();
      loadStudents();
    } catch (error) {
      console.error('绑定失败:', error);
      message.error(error.error || error.message || '绑定失败，请检查学生账号是否存在');
    }
  };

  const handleUnbindStudent = async (studentId) => {
    try {
      await userService.unbindStudent(studentId);
      message.success('解绑成功');
      loadStudents();
    } catch (error) {
      message.error('解绑失败');
    }
  };

  const handleOpenSettings = async (student) => {
    setSelectedStudent(student);
    setSettingsModalVisible(true);
    
    try {
      // 加载专注设置
      const focusSettings = await focusService.getFocusSettings(student.student_id);
      // 加载积分规则
      const rules = await pointsService.getRules(student.student_id);
      // 加载奖励列表
      const rewardList = await pointsService.getRewards(student.student_id);
      
      setStudentSettings(focusSettings);
      setPointRules(rules);
      setRewards(rewardList);
      
      settingsForm.setFieldsValue(focusSettings);
    } catch (error) {
      message.error('加载设置失败');
    }
  };

  const handleSaveSettings = async (values) => {
    try {
      await focusService.updateFocusSettings(selectedStudent.student_id, values);
      message.success('设置保存成功');
      setSettingsModalVisible(false);
    } catch (error) {
      message.error('保存失败');
    }
  };

  const studentColumns = [
    {
      title: '学生昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenSettings(record)}
          >
            设置
          </Button>
          <Popconfirm
            title="确定解绑？"
            onConfirm={() => handleUnbindStudent(record.student_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              解绑
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name',
    },
    {
      title: '类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      render: (type) => (type === 'add' ? '加分' : '扣分'),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '触发条件',
      dataIndex: 'condition',
      key: 'condition',
    },
  ];

  const rewardColumns = [
    {
      title: '奖励名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所需积分',
      dataIndex: 'points_required',
      key: 'points_required',
    },
    {
      title: '类型',
      dataIndex: 'reward_type',
      key: 'reward_type',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (active ? '启用' : '禁用'),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title="系统设置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)}>
            添加学生
          </Button>
        }
      >
        <Table
          columns={studentColumns}
          dataSource={students}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="绑定学生设备"
        open={bindModalVisible}
        onCancel={() => setBindModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleBindStudent} layout="vertical">
          <Form.Item
            name="student_phone"
            label="学生手机号"
            rules={[{ required: true, message: '请输入学生手机号' }]}
          >
            <Input placeholder="请输入学生手机号" />
          </Form.Item>

          <Form.Item
            name="device_name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>

          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select placeholder="请选择设备类型">
              <Option value="android_tablet">安卓平板</Option>
              <Option value="windows">Windows电脑</Option>
              <Option value="display">智能显示器</Option>
              <Option value="tv">安卓电视</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="lock_screen_password"
            label="锁屏密码"
          >
            <Input.Password placeholder="设置锁屏密码（可选）" />
          </Form.Item>

          <Form.Item
            name="max_volume"
            label="最大音量"
            initialValue={100}
          >
            <Slider min={0} max={100} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              绑定
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`学生设置 - ${selectedStudent?.nickname}`}
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Tabs defaultActiveKey="focus">
          <TabPane tab="专注设置" key="focus">
            <Form
              form={settingsForm}
              onFinish={handleSaveSettings}
              layout="vertical"
              initialValues={studentSettings}
            >
              <Form.Item
                name="focus_duration"
                label="专注时长（分钟）"
              >
                <Select>
                  <Option value={15}>15分钟</Option>
                  <Option value={25}>25分钟</Option>
                  <Option value={30}>30分钟</Option>
                  <Option value={45}>45分钟</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="break_duration"
                label="休息时长（分钟）"
              >
                <Select>
                  <Option value={5}>5分钟</Option>
                  <Option value={10}>10分钟</Option>
                  <Option value={15}>15分钟</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="force_lock"
                label="强制锁机模式"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="mode"
                label="专注模式"
              >
                <Select>
                  <Option value="pomodoro">番茄钟</Option>
                  <Option value="long_session">长时段刷题</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="积分规则" key="points">
            <Table
              columns={ruleColumns}
              dataSource={pointRules}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="奖励设置" key="rewards">
            <Table
              columns={rewardColumns}
              dataSource={rewards}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default Settings;
