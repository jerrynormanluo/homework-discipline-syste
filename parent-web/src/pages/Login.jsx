import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values.phone, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error(error.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card title="作业自律助手 - 家长端" style={styles.card}>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="手机号" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>

          <div style={styles.registerLink}>
            还没有账号？<a href="/register">去注册</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    width: 400,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  registerLink: {
    textAlign: 'center',
    marginTop: 16,
  },
};

export default Login;
