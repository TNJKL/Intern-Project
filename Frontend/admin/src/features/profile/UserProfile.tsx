import React, { useState } from 'react';
import { Card, Descriptions, Avatar, Tag, Typography, Row, Col } from 'antd';
import {
  UserOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/zustand/useAuthStore';
import EditProfileModal from './components/EditProfileModal';
import ChangePasswordModal from './components/ChangePasswordModal';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  return (
    <div className="p-4 sm:p-10 min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1000px] mx-auto">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 bg-white p-6 sm:p-10 rounded-[24px] shadow-sm border border-[#f1f1f1] mb-6">
          <Avatar
            size={120}
            src={user.avatarUrl}
            icon={!user.avatarUrl && <UserOutlined />}
            style={{ 
              backgroundColor: '#fdf3eb', 
              color: '#d37533',
              border: '4px solid #fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              flexShrink: 0
            }}
          />
          <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2 w-full">
              <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                {user.fullName}
              </Title>
              <Tag color="orange" style={{ borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', margin: 0 }}>
                {user.role}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }} className="break-all justify-center md:justify-start w-full">
              <MailOutlined /> {user.email}
            </Text>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-center mt-4 md:mt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1
              }}
              className="sm:flex-none hover:bg-gray-50 active:scale-95"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: '#4d362b',
                color: '#fff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1
              }}
              className="sm:flex-none hover:opacity-90 active:scale-95"
            >
              Mật khẩu
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card 
              variant="borderless" 
              style={{ borderRadius: '24px', border: '1px solid #f1f1f1', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
            >
              <Title level={5} style={{ marginBottom: '24px', fontWeight: 800 }}>Thông tin chi tiết</Title>
              <Descriptions column={1} styles={{ label: { color: '#94a3b8', fontWeight: 600, width: '120px' }, content: { color: '#1e293b', fontWeight: 600 } }}>
                <Descriptions.Item label="SỐ ĐIỆN THOẠI">{user.phone || 'Chưa cập nhật'}</Descriptions.Item>
                <Descriptions.Item label="ĐỊA CHỈ">Việt Nam</Descriptions.Item>
                <Descriptions.Item label="NGÀY GIA NHẬP">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}</Descriptions.Item>
                <Descriptions.Item label="TRẠNG THÁI">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Hoạt động
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card 
                variant="borderless" 
                style={{ borderRadius: '24px', background: '#4d362b', color: '#fff', boxShadow: '0 10px 30px rgba(77, 54, 43, 0.2)' }}
              >
                <Title level={5} style={{ color: '#fff', marginBottom: '12px' }}>Quyền hạn</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>
                  Bạn có toàn quyền truy cập vào các mô-đun quản lý: Sản phẩm, Đơn hàng, và Người dùng.
                </Text>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <EditProfileModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        user={user}
        loading={loading}
        setLoading={setLoading}
      />

      <ChangePasswordModal
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        loading={loading}
        setLoading={setLoading}
      />
    </div>
  );
};

export default UserProfile;
