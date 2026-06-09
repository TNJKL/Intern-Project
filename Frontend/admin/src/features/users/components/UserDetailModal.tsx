import { Modal, Tag } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={460} // ✅ Thu gọn chiều ngang từ 550px xuống 460px giúp modal vừa vặn, tinh tế hơn
      styles={{
        body: { padding: '28px 24px', backgroundColor: '#fdfaf5', borderRadius: '24px' }, // ✅ Đổi nền sang màu cream nhẹ đồng bộ với profile client
        mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(77, 54, 43, 0.15)' }
      }}
    >
      {/* ─── KHU VỰC TOP: AVATAR & DANH TÍNH ─── */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-3 border border-amber-100 shadow-sm overflow-hidden relative">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <UserOutlined className="text-3xl text-amber-900/20" />
          )}
        </div>

        <h2 className="text-xl font-black text-[#4d362b] tracking-tight mb-1">
          {user.fullName || 'Người dùng'}
        </h2>

        <div className="flex items-center gap-1.5">
          <Tag className={`border-none rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'}`}>
            {user.role}
          </Tag>
          <span className="text-[10px] font-bold text-gray-400">
            #{user.id.substring(0, 8)}
          </span>
        </div>
      </div>

      {/* ─── KHU VỰC THÔNG TIN CHÍNH (DẠNG CARD ĐƠN GIẢN) ─── */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100/40 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
            <MailOutlined className="text-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Email liên hệ</p>
            <p className="text-sm font-bold text-gray-700 truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
            <PhoneOutlined className="text-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Số điện thoại</p>
            <p className="text-sm font-bold text-gray-700 truncate">{user.phone || 'Chưa cập nhật'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
            <SafetyCertificateOutlined className="text-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Trạng thái tài khoản</p>
            <span className={`text-xs font-black uppercase tracking-wider ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user.isActive ? '● Đang hoạt động' : '● Đang bị khóa'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── KHU VỰC THỜI GIAN (DẠNG GRID NHỎ PHÍA DƯỚI) ─── */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-white/60 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ngày tham gia</span>
          <span className="text-xs font-bold text-gray-600">{formatDate(user.createdAt)}</span>
        </div>
        <div className="bg-white/60 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Cập nhật cuối</span>
          <span className="text-xs font-bold text-gray-600">{formatDate(user.updatedAt)}</span>
        </div>
      </div>

      {/* ─── HÀNH ĐỘNG ĐÓNG ─── */}
      <div className="mt-6">
        <button
          onClick={onClose}
          className="w-full py-3 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99]"
        >
          Đóng cửa sổ
        </button>
      </div>
    </Modal>
  );
};