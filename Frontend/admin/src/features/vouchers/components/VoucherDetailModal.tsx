import React from 'react';
import { Modal, Descriptions, Badge, Progress, Space, Divider } from 'antd';
import { CalendarOutlined, SafetyCertificateOutlined, InboxOutlined, ShoppingOutlined, TrophyOutlined } from '@ant-design/icons';
import type { Voucher } from '@/services/voucherService';
import dayjs from 'dayjs';

interface VoucherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: Voucher | null;
}

export const VoucherDetailModal: React.FC<VoucherDetailModalProps> = ({
  isOpen,
  onClose,
  voucher,
}) => {
  if (!voucher) return null;

  const isPercentage = voucher.discountType === 'PERCENTAGE';
  const validFromStr = dayjs(voucher.validFrom).format('DD/MM/YYYY HH:mm');
  const validUntilStr = voucher.validUntil 
    ? dayjs(voucher.validUntil).format('DD/MM/YYYY HH:mm') 
    : 'Không giới hạn';

  const usagePercent = Math.min(100, Math.round((voucher.currentUsageCount / voucher.maxUsageCount) * 100));

  return (
    <Modal
      title="Chi tiết Mã Khuyến mãi"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={550}
      style={{ top: 50 }}
    >
      <div className="py-2">
        {/* Ticket Design */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl border-2 border-dashed border-amber-200 p-6 mb-6">
          {/* Half circles cutouts on the sides for coupon ticket feel */}
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full border-r-2 border-dashed border-amber-200 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full border-l-2 border-dashed border-amber-200 -translate-y-1/2"></div>

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">BREWTRA TICKET</span>
              <h2 className="text-3xl font-black text-amber-950 uppercase tracking-wide">{voucher.code}</h2>
              <p className="text-sm font-bold text-amber-900">{voucher.name}</p>
            </div>
            <div className="text-right">
              <Badge 
                status={voucher.isActive ? 'success' : 'default'} 
                text={voucher.isActive ? 'Đang hoạt động' : 'Tạm ẩn'} 
                className="font-bold text-xs"
              />
              <div className="mt-2 text-2xl font-black text-amber-700">
                {isPercentage ? `${voucher.discountValue}%` : `${voucher.discountValue.toLocaleString()}đ`}
              </div>
              <div className="text-[10px] text-amber-600/70 font-semibold">
                {isPercentage ? 'Giảm theo phần trăm' : 'Giảm số tiền cố định'}
              </div>
            </div>
          </div>

          <Divider dashed className="my-4 border-amber-200" />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-900/80">
              <ShoppingOutlined className="text-amber-600 text-sm" />
              <span>Đơn tối thiểu: <strong>{voucher.minOrderAmount.toLocaleString()}đ</strong></span>
            </div>
            {isPercentage && (
              <div className="flex items-center gap-2 text-amber-900/80">
                <TrophyOutlined className="text-amber-600 text-sm" />
                <span>Giảm tối đa: <strong>{voucher.maxDiscountAmount.toLocaleString()}đ</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="space-y-6">
          {/* Progress Tracker */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <InboxOutlined /> Lượt sử dụng
              </span>
              <span className="text-xs font-bold text-gray-800">
                {voucher.currentUsageCount} / {voucher.maxUsageCount} lượt
              </span>
            </div>
            <Progress 
              percent={usagePercent} 
              strokeColor={{
                '0%': '#f59e0b',
                '100%': '#d97706',
              }}
              status={usagePercent >= 100 ? 'normal' : 'active'}
              className="mb-0"
            />
          </div>

          {/* Time range */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <CalendarOutlined /> Thời gian áp dụng
            </span>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <p className="text-gray-400">Ngày bắt đầu</p>
                <p className="text-gray-800 font-bold mt-0.5">{validFromStr}</p>
              </div>
              <div>
                <p className="text-gray-400">Ngày kết thúc</p>
                <p className="text-gray-800 font-bold mt-0.5">{validUntilStr}</p>
              </div>
            </div>
          </div>

          {/* System Audit */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <SafetyCertificateOutlined /> Thông tin hệ thống
            </span>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <p className="text-gray-400">Mã định danh (ID)</p>
                <p className="text-gray-800 font-bold truncate mt-0.5" title={voucher.id}>{voucher.id}</p>
              </div>
              <div>
                <p className="text-gray-400">Ngày khởi tạo</p>
                <p className="text-gray-800 font-bold mt-0.5">
                  {dayjs(voucher.createdAt).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
