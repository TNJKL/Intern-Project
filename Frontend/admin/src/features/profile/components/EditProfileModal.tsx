import React, { useEffect } from 'react';
import { Modal, Form, Input, Space, Typography } from 'antd';
import { message } from '@/lib/antd';
import { userService } from '../../../services/user.service';
import { useAuthStore } from '../../../store/zustand/useAuthStore';

const { Title } = Typography;

interface EditProfileModalProps {
  open: boolean;
  onCancel: () => void;
  user: any;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onCancel, user, loading, setLoading }) => {
  const [form] = Form.useForm();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, open, form]);

  const handleUpdate = async (values: any) => {
    setLoading(true);
    try {
      const updateData = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || '',
      };
      const response = await userService.updateProfile(updateData);
      const updatedUser = response.data || { ...user, ...updateData };
      setAuth(updatedUser, useAuthStore.getState().accessToken || '');

      message.success('Cập nhật hồ sơ thành công!');
      onCancel();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0, color: '#3c2a21' }}>Chỉnh sửa hồ sơ</Title>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
      forceRender
      styles={{ 
        body: { borderRadius: 24, padding: '32px 40px' },
        header: { marginBottom: 24, border: 'none' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdate}
        requiredMark={false}
      >
        <Form.Item
          label="Họ và tên"
          name="fullName"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
        >
          <Input size="large" placeholder="Nhập họ và tên" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input size="large" placeholder="Nhập email" />
        </Form.Item>
        <Form.Item
          label="Số điện thoại"
          name="phone"
        >
          <Input size="large" placeholder="Nhập số điện thoại" />
        </Form.Item>
        
        <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'end' }}>
            <button
              type="button"
              onClick={onCancel}
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
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
