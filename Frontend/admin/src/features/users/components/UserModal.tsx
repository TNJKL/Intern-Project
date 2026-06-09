import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import type { User, UserPayload } from '@/types/user';

interface UserModalProps {
  isOpen: boolean;
  editingUser: User | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: (payload: UserPayload) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  editingUser,
  isLoading,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        form.setFieldsValue({
          ...editingUser,
          password: '', // Không hiển thị mật khẩu cũ
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editingUser, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const payload = { ...values };
      if (editingUser && !payload.password) {
        delete payload.password; // Tránh gửi chuỗi rỗng
      }
      onSave(payload);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={<span className="text-xl font-black uppercase text-gray-800">{editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}</span>}
      open={isOpen}
      onCancel={handleCancel}
      onOk={handleSave}
      okText={editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
      cancelText="Hủy"
      confirmLoading={isLoading}
      okButtonProps={{ className: 'bg-[#d37533] rounded-lg font-bold shadow-md' }}
      cancelButtonProps={{ className: 'rounded-lg font-bold' }}
      centered
      width={700}
      styles={{ body: { borderRadius: '24px', padding: '12px 0' } }}
    >
      <Form form={form} layout="vertical" className="px-6 py-4">
        <div className="grid grid-cols-2 gap-6">
          <Form.Item 
            name="fullName" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2">Họ và tên</span>}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input size="large" placeholder="Ví dụ: Nguyễn Văn A" className="rounded-xl border-gray-200 h-12" />
          </Form.Item>
          
          <Form.Item 
            name="email" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2">Email</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input size="large" placeholder="Ví dụ: email@domain.com" className="rounded-xl border-gray-200 h-12" />
          </Form.Item>
        </div>

        <Form.Item 
          name="password" 
          label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2">Mật khẩu</span>}
          rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password size="large" placeholder={editingUser ? "Bỏ trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu"} className="rounded-xl border-gray-200 h-12" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-6">
          <Form.Item 
            name="phone" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2">Số điện thoại</span>}
          >
            <Input size="large" placeholder="Ví dụ: 0797619239" className="rounded-xl border-gray-200 h-12" />
          </Form.Item>

          <Form.Item 
            name="role" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2">Vai trò</span>}
            initialValue="CUSTOMER"
          >
            <Select size="large" className="rounded-xl [&>.ant-select-selector]:!rounded-xl h-12">
              <Select.Option value="CUSTOMER">Khách hàng (CUSTOMER)</Select.Option>
              <Select.Option value="ADMIN">Quản trị viên (ADMIN)</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item 
          name="avatarUrl" 
          label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2">URL Ảnh đại diện</span>}
          className="mb-0"
        >
          <Input size="large" placeholder="Ví dụ: https://..." className="rounded-xl border-gray-200 h-12" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
