import React, { useState } from 'react';
import { Card, Descriptions, Avatar, Tag, Typography, Row, Col, Flex } from 'antd';
import {
  UserOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
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
    <div style={{ padding: '40px', background: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Profile Header */}
        <div style={{ 
          background: '#fff', 
          padding: '40px', 
          borderRadius: '24px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          border: '1px solid #f1f1f1',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }}>
          <Avatar
            size={120}
            src={user.avatarUrl}
            icon={!user.avatarUrl && <UserOutlined />}
            style={{ 
              backgroundColor: '#fdf3eb', 
              color: '#d37533',
              border: '4px solid #fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>{user.fullName}</Title>
              <Tag color="orange" style={{ borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
                {user.role}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MailOutlined /> {user.email}
            </Text>
          </div>
          <Flex gap={12}>
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
                transition: 'all 0.2s'
              }}
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
                transition: 'all 0.2s'
              }}
            >
              Mật khẩu
            </button>
          </Flex>
        </div>

        {/* Info Grid */}
        <Row gutter={24}>
          <Col span={16}>
            <Card 
              variant="borderless" 
              style={{ borderRadius: '24px', border: '1px solid #f1f1f1', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
            >
              <Title level={5} style={{ marginBottom: '24px', fontWeight: 800 }}>Thông tin chi tiết</Title>
              <Descriptions column={1} labelStyle={{ color: '#94a3b8', fontWeight: 600, width: '150px' }} contentStyle={{ color: '#1e293b', fontWeight: 600 }}>
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
          <Col span={8}>
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
