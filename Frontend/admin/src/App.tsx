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
import Ingredients from './pages/Ingredients';
import IngredientAlerts from './pages/IngredientAlerts';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Vouchers from './pages/Vouchers';
import { AuthGuard } from './components/AuthGuard';
import { AntdStaticHelper } from './lib/antd';
import { SocketProvider } from './components/providers/SocketProvider';



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
            fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
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
          <SocketProvider>
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
                          <Route path="ingredients" element={<Ingredients />} />
                          <Route path="ingredients/alerts" element={<IngredientAlerts />} />
                          <Route path="users" element={<Users />} />
                          <Route path="orders" element={<Orders />} />
                          <Route path="chat" element={<Chat />} />
                          <Route path="profile" element={<Profile />} />
                          <Route path="vouchers" element={<Vouchers />} />
                          <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                      </AdminLayout>
                    </AuthGuard>
                  }
                />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
