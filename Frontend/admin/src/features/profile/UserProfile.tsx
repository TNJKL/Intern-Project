import React, { useState } from 'react';
import { Card, Descriptions, Avatar, Tag, Typography, Row, Col, Flex } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  EditOutlined,
  KeyOutlined,
  EnvironmentOutlined
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
    <div style={{ padding: '0 0 60px 0', background: '#fdfaf5', minHeight: '100%', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header Background - Lighter Warm Brown Gradient */}
      <div style={{
        height: 220,
        background: 'linear-gradient(135deg, #663924ff 0%, #63473a 100%)',
        position: 'relative',
        borderRadius: '0 0 50px 50px',
        boxShadow: '0 15px 35px rgba(77, 54, 43, 0.2)'
      }}>
        <div style={{ position: 'absolute', bottom: -50, left: 60, display: 'flex', alignItems: 'end', gap: 32 }}>
          <div style={{ position: 'relative' }}>
            <Avatar
              size={150}
              src={user.avatarUrl}
              icon={!user.avatarUrl && <UserOutlined />}
              style={{
                backgroundColor: '#fff',
                border: '8px solid #fff',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                color: '#d37533'
              }}
            />
          </div>
          <div style={{ marginBottom: 60 }}>
            <Title level={1} style={{
              color: '#fff',
              margin: 0,
              fontSize: '46px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              textShadow: '0 10px 20px rgba(0,0,0,0.2)',
              lineHeight: 1
            }}>
              {user.fullName}
            </Title>
          </div>
        </div>
      </div>

      {/* Role and Status - Below the banner line */}
      <div style={{ paddingLeft: 242, marginTop: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tag color="orange" style={{
            borderRadius: 12,
            fontWeight: 900,
            border: '2px solid #fff3e0',
            padding: '6px 20px',
            fontSize: '12px',
            letterSpacing: '0.15em',
            background: '#fff',
            color: '#d37533',
            boxShadow: '0 8px 16px rgba(232, 133, 63, 0.1)',
            margin: 0
          }}>
            {user.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'NHÂN VIÊN'}
          </Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '6px 16px', borderRadius: 20, border: '1px solid #eee', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', boxShadow: '0 0 10px #52c41a' }}></div>
            <Text style={{ color: '#8c8c8c', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trực tuyến</Text>
          </div>
        </div>
      </div>

      <div style={{ padding: '60px 60px 0 60px' }}>
        <Row gutter={40}>
          {/* Left Column: Quick Info */}
          <Col span={8}>
            <Flex vertical gap={32} style={{ width: '100%' }}>
              <Card
                style={{
                  borderRadius: 40,
                  border: 'none',
                  boxShadow: '0 25px 50px -12px rgba(77, 54, 43, 0.15)',
                  background: '#4a352a',
                  color: '#fff',
                  overflow: 'hidden',
                  padding: '10px'
                }}
              >
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Title level={4} style={{ color: '#fff', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 6, height: 24, background: '#d37533', borderRadius: 3 }}></span>
                    Tùy chỉnh
                  </Title>
                  <Flex vertical gap={16}>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '22px',
                        border: 'none',
                        background: '#d37533',
                        color: '#fff',
                        fontWeight: '900',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 15px 30px rgba(211, 117, 51, 0.25)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(211, 117, 51, 0.35)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(211, 117, 51, 0.25)';
                      }}
                    >
                      <EditOutlined style={{ fontSize: 18 }} /> Sửa hồ sơ
                    </button>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '22px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'all 0.4s',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      <KeyOutlined style={{ fontSize: 18 }} /> Đổi mật khẩu
                    </button>
                  </Flex>
                </div>
              </Card>

              <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <Title level={5} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d37533' }}></div>
                  Thông báo
                </Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>Bạn không có thông báo mới nào cần xử lý lúc này.</Text>
              </Card>
            </Flex>
          </Col>

          {/* Right Column: Detailed Info */}
          <Col span={16}>
            <Card
              style={{
                borderRadius: 32,
                border: 'none',
                boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                padding: '15px'
              }}
            >
              <Title level={3} style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 15, fontWeight: 800 }}>
                <span style={{ width: 8, height: 32, background: '#d37533', borderRadius: 4 }}></span>
                Thông tin cá nhân
              </Title>

              <Descriptions
                column={2}
                styles={{
                  label: { fontWeight: '800', color: '#8c8c8c', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
                  content: { fontSize: 16, color: '#5d4037', fontWeight: 600, paddingBottom: 24 }
                }}
              >
                <Descriptions.Item label={<Flex gap={8} align="center"><MailOutlined style={{ color: '#d37533' }} /> Email</Flex>}>
                  {user.email}
                </Descriptions.Item>
                <Descriptions.Item label={<Flex gap={8} align="center"><PhoneOutlined style={{ color: '#d37533' }} /> Số điện thoại</Flex>}>
                  {user.phone || 'Chưa cập nhật'}
                </Descriptions.Item>
                <Descriptions.Item label={<Flex gap={8} align="center"><EnvironmentOutlined style={{ color: '#d37533' }} /> Địa chỉ</Flex>}>
                  <Text>Việt Nam</Text>
                </Descriptions.Item>
                <Descriptions.Item label={<Flex gap={8} align="center"><CalendarOutlined style={{ color: '#d37533' }} /> Ngày gia nhập</Flex>}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{
                marginTop: 40,
                padding: '24px',
                background: '#fafafa',
                borderRadius: 24,
                border: '1px dashed #dcdcdc'
              }}>
                <Title level={5} style={{ marginBottom: 16 }}>Ghi chú quản trị</Title>
                <Text italic type="secondary">
                  Tài khoản này có quyền quản lý toàn bộ hệ thống, bao gồm quản lý người dùng, sản phẩm và đơn hàng. Vui lòng bảo mật thông tin đăng nhập.
                </Text>
              </div>
            </Card>
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
