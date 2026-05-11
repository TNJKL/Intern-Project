import { Modal, Tag } from 'antd';
import { UserOutlined, CalendarOutlined, HistoryOutlined } from '@ant-design/icons';
import type { User } from '@/types/user';

interface UserDetailModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose
}) => {
  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#3c2a21] to-[#634832] rounded-xl flex items-center justify-center shadow-lg shadow-coffee-dark/10">
            <UserOutlined className="text-white text-lg" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold uppercase tracking-tight text-coffee-dark leading-none">Thông tin tài khoản</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Hệ thống Brewtra</span>
              <span className="text-[9px] font-bold text-gray-300">|</span>
              <span className="text-[9px] font-medium text-gray-400">ID: {user.id.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      className="custom-detail-modal"
      styles={{
        body: { padding: '24px 32px', backgroundColor: '#ffffff' },
        mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }
      }}
    >
      <div className="space-y-6 relative">
        {/* Information Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Chủ tài khoản</label>
            <p className="text-base font-bold text-gray-800 tracking-tight leading-tight">{user.fullName || 'Chưa cập nhật'}</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Địa chỉ liên hệ</label>
            <p className="text-sm font-semibold text-gray-700 tracking-tight truncate" title={user.email}>{user.email}</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Số điện thoại</label>
            <p className="text-sm font-semibold text-gray-700 tracking-tight">{user.phone || 'Chưa có số'}</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Vai trò quản trị</label>
            <div>
              <Tag className={`border-none rounded px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm ${user.role === 'ADMIN'
                ? 'bg-purple-600 text-white'
                : 'bg-blue-500 text-white'
                }`}>
                {user.role}
              </Tag>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-1" />

        {/* Status and Dates Section */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${user.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Trạng thái hiện tại</span>
                <span className={`text-xs font-bold uppercase tracking-tight ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isActive ? 'Đang hoạt động' : 'Đang bị khóa'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                <CalendarOutlined className="text-gray-400 text-xs" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Ngày tham gia</span>
                <span className="text-[11px] font-semibold text-gray-600">{formatDate(user.createdAt)}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                <HistoryOutlined className="text-gray-400 text-xs" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Cập nhật cuối</span>
                <span className="text-[11px] font-semibold text-gray-600">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-coffee-light text-white rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all hover:bg-coffee-medium active:scale-95 shadow-md shadow-coffee-light/10"
          >
            Đóng thông tin
          </button>
        </div>
      </div>
    </Modal>
  );
};
