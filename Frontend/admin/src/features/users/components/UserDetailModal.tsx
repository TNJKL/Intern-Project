import { Modal, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={550}
      styles={{
        body: { padding: '40px', backgroundColor: '#ffffff', borderRadius: '24px' },
        mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }
      }}
    >
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 border-2 border-gray-100 shadow-sm overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <UserOutlined className="text-4xl text-[#4d362b]" />
          )}
        </div>
        <h2 className="text-2xl font-black text-[#4d362b] uppercase tracking-tight mb-1">{user.fullName || 'Người dùng'}</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">ID: {user.id.substring(0, 8)}</span>
          <Tag className={`border-none rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
            {user.role}
          </Tag>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email liên hệ</span>
          <span className="text-sm font-semibold text-gray-700">{user.email}</span>
        </div>

        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
          <span className="text-sm font-semibold text-gray-700">{user.phone || 'Chưa cập nhật'}</span>
        </div>

        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {user.isActive ? 'Đang hoạt động' : 'Đang bị khóa'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày tham gia</span>
            <span className="text-[11px] font-bold text-gray-600 text-center">{formatDate(user.createdAt)}</span>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cập nhật cuối</span>
            <span className="text-[11px] font-bold text-gray-600 text-center">{formatDate(user.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onClose}
          className="w-full py-4 bg-[#d37533] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-[#b85c1e] active:scale-[0.98] shadow-lg shadow-[#d37533]/20"
        >
          Đóng thông tin
        </button>
      </div>
    </Modal>
  );
};
