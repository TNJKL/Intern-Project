import React, { useState } from 'react';
import { Card, Table, Button, Input, Space } from 'antd';
import { message, modal } from '@/lib/antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import type { User, UserPayload } from '@/types/user';
import type { TablePaginationConfig } from 'antd';
import { UserModal } from './components/UserModal';
import { UserDetailModal } from './components/UserDetailModal';

const PAGE_SIZE = 8;

const UserList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Lấy danh sách users có phân trang
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', currentPage],
    queryFn: () => userService.getUsers(currentPage - 1, PAGE_SIZE),
  });

  // Mutation tạo user
  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      message.success('Thêm người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setCurrentPage(1);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm người dùng!');
    }
  });

  // Mutation cập nhật user
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<UserPayload> }) => userService.updateUser(id, data),
    onSuccess: () => {
      message.success('Cập nhật người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
    }
  });

  // Mutation xóa user
  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      message.success('Xóa người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Nếu xóa hết trang cuối, quay lại trang trước
      const remaining = (usersData?.data?.content?.length ?? 1) - 1;
      if (remaining === 0 && currentPage > 1) setCurrentPage((p) => p - 1);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa!');
    }
  });

  const handleOpenModal = (record?: User) => {
    setEditingUser(record || null);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (record: User) => {
    setSelectedUser(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };

  const handleSave = (payload: UserPayload) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      createUserMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa người dùng này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteUserMutation.mutate(id);
      }
    });
  };

  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TÊN NGƯỜI DÙNG</span>,
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string) => <span className="font-bold text-gray-800">{text || 'N/A'}</span>
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">EMAIL</span>,
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">VAI TRÒ</span>,
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
          {role || 'USER'}
        </span>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {isActive ? 'HOẠT ĐỘNG' : 'BỊ KHÓA'}
        </span>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">HÀNH ĐỘNG</span>,
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined className="text-blue-500" />} onClick={() => handleOpenDetail(record)} />
          <Button type="text" icon={<EditOutlined className="text-[#d37533]" />} onClick={() => handleOpenModal(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  // Xử lý dữ liệu trả về theo format API (response.data.data.content)
  const dataSource: User[] = usersData?.data?.content || [];
  const totalElements: number = usersData?.data?.totalElements ?? 0;

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current ?? 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Quản lý Người Dùng</h2>
          <p className="text-gray-500 font-medium mt-1">Quản lý danh sách tài khoản trong hệ thống</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="bg-gray-800 hover:bg-black rounded-xl font-bold px-6 shadow-md"
          onClick={() => handleOpenModal()}
        >
          Thêm người dùng
        </Button>
      </div>

      <Card variant="borderless" className="rounded-[32px] shadow-sm border border-gray-100 p-2" styles={{ body: { padding: '24px' } }}>
        <div className="mb-6 flex gap-4 max-w-md">
          <Input
            size="large"
            placeholder="Tìm kiếm người dùng..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-primary focus:bg-white transition-all"
          />
        </div>

        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey={(record: User) => record.id || record.email}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: totalElements,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} người dùng`,
            className: 'custom-pagination',
          }}
          className="custom-admin-table"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      <UserModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        user={selectedUser}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default UserList;
