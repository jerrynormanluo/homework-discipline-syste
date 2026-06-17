import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      await authService.register(values.phone, values.password, 'parent', values.nickname);
      message.success('注册成功');
      navigate('/');
    } catch (error) {
      message.error(error.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card title="注册家长账号" style={styles.card}>
        <Form
          name="register"
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
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="昵称" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少6位）"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>

          <div style={styles.loginLink}>
            已有账号？<a href="/login">去登录</a>
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
  loginLink: {
    textAlign: 'center',
    marginTop: 16,
  },
};

export default Register;
