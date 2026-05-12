import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Đơn hàng',
    },
    {
      key: '/admin/products',
      icon: <ShoppingOutlined />,
      label: 'Sản phẩm',
    },
    {
      key: '/admin/toppings',
      icon: <TagsOutlined />, // Using TagsOutlined for Toppings
      label: 'Topping',
    },
    {
      key: '/admin/categories',
      icon: <TagsOutlined />,
      label: 'Danh mục',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
    },
    {
      key: '/admin/chat',
      icon: <MessageOutlined />,
      label: 'Hỗ trợ Chat',
    },
    {
      key: 'view-website',
      icon: <GlobalOutlined />,
      label: 'Xem trang chủ',
    },
  ];

  const handleMenuClick = (key: string) => {
    if (key === 'view-website') {
      const { accessToken, refreshToken, user } = useAuthStore.getState();
      const authData = encodeURIComponent(JSON.stringify({ user, accessToken, refreshToken }));
      window.location.href = `http://localhost:3000?auth=${authData}`;
    } else {
      navigate(key);
    }
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" className="shadow-md overflow-y-auto">
        <div className="h-16 flex items-center justify-center font-bold text-lg text-coffee-dark uppercase tracking-wider overflow-hidden px-2 whitespace-nowrap" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          {collapsed ? 'B' : 'Brewtra Admin'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout className="h-screen">
        <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center px-4 shadow-sm z-10 shrink-0">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div className="flex items-center gap-4 pr-6">
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', label: 'Hồ sơ' },
                  { key: 'view-website', label: 'Xem trang chủ' },
                  { key: 'logout', label: 'Đăng xuất', danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    logout();
                    window.location.href = `http://localhost:3000/login?logout=true&t=${Date.now()}`;
                  } else if (key === 'view-website') {
                    // Pass current auth back to client to sync session
                    const { accessToken, refreshToken, user } = useAuthStore.getState();
                    const authData = encodeURIComponent(JSON.stringify({ user, accessToken, refreshToken }));
                    window.location.href = `http://localhost:3000?auth=${authData}`;
                  } else if (key === 'profile') {
                    navigate('/admin/profile');
                  }
                }
              }}
              placement="bottomRight"
            >
              <Space className="cursor-pointer">
                <Avatar src={user?.avatarUrl} icon={!user?.avatarUrl && <UserOutlined />} />
                <span className="font-medium">{user?.fullName || user?.email || 'Admin'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
          className="overflow-auto"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
