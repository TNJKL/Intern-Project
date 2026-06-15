import React, { useState, useEffect } from 'react';
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
  GiftOutlined,
  MenuOutlined,
  BellOutlined,
  CreditCardOutlined,
  CoffeeOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space, Drawer, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/zustand/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { ingredientService } from '../services/ingredient.service';

const { Header, Sider, Content } = Layout;

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [siderWidth, setSiderWidth] = useState(() => {
    const saved = localStorage.getItem('admin-sider-width');
    return saved ? parseInt(saved, 10) : 240;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 450) {
        setSiderWidth(newWidth);
        localStorage.setItem('admin-sider-width', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/ingredients')) {
      setOpenKeys(['ingredients-group']);
    } else if (location.pathname.startsWith('/admin/products')) {
      setOpenKeys(['products-group']);
    }
  }, [location.pathname]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { data: alertCountRes } = useQuery({
    queryKey: ['ingredients', 'alerts-count'],
    queryFn: () => ingredientService.getIngredientAlertCount(),
    refetchInterval: 30000,
    enabled: !!user,
  });
  const alertCount = alertCountRes?.count || 0;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      key: '/admin/payments-refunds',
      icon: <CreditCardOutlined />,
      label: 'Thanh toán & Hoàn tiền',
    },
    {
      key: 'products-group',
      icon: <ShoppingOutlined />,
      label: 'Sản phẩm',
      children: [
        {
          key: '/admin/products/manage',
          icon: <ShoppingOutlined />,
          label: 'Quản lý sản phẩm',
        },
        {
          key: '/admin/products/estimate',
          icon: <ExperimentOutlined />,
          label: 'Ước tính sản lượng',
        },
      ]
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
      key: 'ingredients-group',
      icon: <CoffeeOutlined />,
      label: 'Nguyên liệu',
      children: [
        {
          key: '/admin/ingredients/manage',
          icon: <CoffeeOutlined />,
          label: 'Quản lý nguyên liệu',
        },
        {
          key: '/admin/ingredients/toppings',
          icon: <TagsOutlined />,
          label: 'Topping tồn kho',
        },
        {
          key: '/admin/ingredients/recipes',
          icon: <ExperimentOutlined />,
          label: 'Công thức pha chế',
        },
      ]
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
    },
    {
      key: '/admin/vouchers',
      icon: <GiftOutlined />,
      label: 'Khuyến mãi',
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
      const state = useAuthStore.getState() as any;
      const { accessToken, refreshToken, user } = state;
      const authData = encodeURIComponent(JSON.stringify({ user, accessToken, refreshToken }));
      window.location.href = `http://localhost:3000?auth=${authData}`;
    } else {
      navigate(key);
    }
  };

  return (
    <Layout className="h-screen overflow-hidden">
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={siderWidth}
          theme="light"
          className="shadow-md overflow-y-auto relative"
          style={isResizing ? { transition: 'none' } : undefined}
        >
          <div className="h-16 flex items-center justify-center font-bold text-lg text-coffee-dark uppercase tracking-wider overflow-hidden px-2 whitespace-nowrap" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            {collapsed ? 'B' : 'Brewtra Admin'}
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={collapsed ? undefined : openKeys}
            onOpenChange={setOpenKeys}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
          />
          {!collapsed && (
            <div
              onMouseDown={startResizing}
              className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-50 hover:bg-orange-500/20 active:bg-orange-500/40 transition-colors ${
                isResizing ? 'bg-orange-500/40' : 'bg-transparent'
              }`}
            />
          )}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          title={<div className="font-bold text-lg text-coffee-dark uppercase tracking-wider">Brewtra Admin</div>}
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          styles={{ body: { padding: 0 } }}
          width={250}
        >
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            items={menuItems}
            onClick={({ key }) => {
              handleMenuClick(key);
              setDrawerOpen(false);
            }}
          />
        </Drawer>
      )}

      <Layout className="h-screen">
        <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center px-4 shadow-sm z-10 shrink-0">
          <Button
            type="text"
            icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setDrawerOpen(!drawerOpen) : setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div className="flex items-center gap-4 pr-6">
            <Badge count={alertCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px' }} />}
                onClick={() => navigate('/admin/ingredients/alerts')}
                style={{ width: 40, height: 40 }}
                className="flex items-center justify-center text-gray-600 hover:text-orange-500"
              />
            </Badge>
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
                    const state = useAuthStore.getState() as any;
                    const { accessToken, refreshToken, user } = state;
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
                <span className="font-medium hidden sm:inline">{user?.fullName || user?.email || 'Admin'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? '12px 8px' : '24px 16px',
            padding: isMobile ? 12 : 24,
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
