import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Toppings from './pages/Toppings';
import Orders from './pages/Orders';
import Chat from './pages/Chat';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Profile from './pages/Profile';
import { AuthGuard } from './components/AuthGuard';
import { AntdStaticHelper } from './lib/antd';



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#d37533',
            borderRadius: 12,
            fontFamily: "'Noto Sans Vietnamese', sans-serif",
          },
          components: {
            Message: {
              contentBg: '#fff',
              contentPadding: '16px 24px',
              boxShadow: '0 20px 40px -10px rgba(60,42,33,0.15)',
              zIndexPopup: 9999,
            },
          },
        }}
      >
        <AntApp>
          <AntdStaticHelper />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/*"
                element={
                  <AuthGuard>
                    <AdminLayout>
                      <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="toppings" element={<Toppings />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="users" element={<Users />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </AdminLayout>
                  </AuthGuard>
                }
              />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
