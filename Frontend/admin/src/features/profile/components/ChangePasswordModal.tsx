import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Space, Typography } from 'antd';
import { message } from '@/lib/antd';
import { userService } from '../../../services/user.service';
import { useAuthStore } from '../../../store/zustand/useAuthStore';

const { Title, Text } = Typography;

interface ChangePasswordModalProps {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const COUNTDOWN_SECONDS = 4;

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onCancel, loading, setLoading }) => {
  const [form] = Form.useForm();
  const { logout } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  // Đếm ngược khi thành công
  useEffect(() => {
    if (!isSuccess) return;
    setCountdown(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  // Logout khi countdown về 0 (tách riêng để tránh setState-in-render)
  useEffect(() => {
    if (isSuccess && countdown === 0) {
      logout();
    }
  }, [isSuccess, countdown]);

  // Reset state khi đóng modal
  const handleClose = () => {
    setIsSuccess(false);
    setCountdown(COUNTDOWN_SECONDS);
    form.resetFields();
    onCancel();
  };

  const handlePasswordUpdate = async (values: any) => {
    setLoading(true);
    try {
      await userService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      form.resetFields();
      setIsSuccess(true);
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message || '';
      let errMsg = 'Có lỗi xảy ra, vui lòng thử lại!';
      if (status === 400 || status === 401) {
        errMsg = 'Mật khẩu cũ không đúng!';
      } else if (serverMsg) {
        errMsg = serverMsg;
      }
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        !isSuccess
          ? <Title level={4} style={{ margin: 0, color: '#3c2a21' }}>Đổi mật khẩu</Title>
          : null
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={450}
      forceRender
      closable={!isSuccess}
      mask={{ closable: !isSuccess }}
      styles={{
        body: { borderRadius: 24, padding: '32px 40px' },
        header: { marginBottom: 24, border: 'none' }
      }}
    >
      {isSuccess ? (
        /* ── Màn hình thành công ── */
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          {/* Icon check */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #52c41a, #95de64)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 16px 40px rgba(82,196,26,0.25)'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <Title level={3} style={{ color: '#3c2a21', margin: '0 0 12px' }}>
            Đổi mật khẩu thành công!
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: 14, display: 'block', marginBottom: 32, lineHeight: 1.7 }}>
            Mật khẩu của bạn đã được cập nhật.<br />
            Vui lòng đăng nhập lại để tiếp tục.
          </Text>

          {/* Countdown ring */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '4px solid #f0f0f0',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            background: '#fafafa',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#3c2a21', lineHeight: 1 }}>{countdown}</span>
            <span style={{ fontSize: 9, color: '#aaa', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>giây</span>
          </div>

          <Text style={{ color: '#bfbfbf', fontSize: 12 }}>
            Tự động chuyển hướng sau <strong style={{ color: '#595959' }}>{countdown}</strong> giây...
          </Text>
        </div>
      ) : (
        /* ── Form đổi mật khẩu ── */
        <Form form={form} layout="vertical" onFinish={handlePasswordUpdate} requiredMark={false}>
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
          >
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '10px 24px',
                  borderRadius: 16,
                  border: 'none',
                  background: '#f5f5f5',
                  color: '#8c8c8c',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 32px',
                  borderRadius: 16,
                  border: 'none',
                  background: '#3c2a21',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ChangePasswordModal;
