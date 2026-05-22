import React from 'react';
import { Modal, Badge, Progress, Divider } from 'antd';
import { CalendarOutlined, SafetyCertificateOutlined, InboxOutlined, ShoppingOutlined, TrophyOutlined } from '@ant-design/icons';
import type { Voucher } from '@/services/voucher.service';
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

  const usagePercent = voucher.maxUsageCount
    ? Math.min(100, Math.round((voucher.currentUsageCount / voucher.maxUsageCount) * 100))
    : 0;

  return (
    <Modal
      title={<span className="text-2xl font-black text-gray-900 tracking-tight">Chi tiết Mã Khuyến mãi</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={840}
      style={{ top: 30 }}
    >
      <div className="py-5 space-y-6">
        {/* Ticket Design */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-[20px] border-2 border-dashed border-amber-200 p-10 shadow-md">
          {/* Half circles cutouts on the sides for coupon ticket feel */}
          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-white rounded-full border-r-2 border-dashed border-amber-200 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-white rounded-full border-l-2 border-dashed border-amber-200 -translate-y-1/2"></div>

          <div className="flex justify-between items-start gap-5">
            <div className="space-y-2">
              <span className="text-sm font-black tracking-widest text-amber-600 uppercase">BREWTRA TICKET</span>
              <h2 className="text-5xl font-black text-amber-950 uppercase tracking-wide leading-none mt-1">{voucher.code}</h2>
              <p className="text-lg font-bold text-amber-900 mt-2">{voucher.name}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-gray-150 shadow-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${voucher.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="font-black text-sm text-gray-800">{voucher.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}</span>
              </span>
              <div className="mt-4 text-4xl font-black text-amber-700 leading-none">
                {isPercentage ? `${voucher.discountValue}%` : `${voucher.discountValue.toLocaleString()}đ`}
              </div>
              <div className="text-sm text-amber-650/80 font-bold mt-1.5">
                {isPercentage ? 'Giảm theo phần trăm' : 'Giảm số tiền cố định'}
              </div>
            </div>
          </div>

          <Divider dashed className="my-7 border-amber-200" />

          <div className="grid grid-cols-2 gap-8 text-base">
            <div className="flex items-center gap-3 text-amber-950 font-bold">
              <ShoppingOutlined className="text-amber-600 text-lg" />
              <span className="text-base">Đơn tối thiểu: <strong className="text-lg text-amber-850">{(voucher.minOrderAmount ?? 0).toLocaleString()}đ</strong></span>
            </div>
            {isPercentage && (
              <div className="flex items-center gap-3 text-amber-950 font-bold">
                <TrophyOutlined className="text-amber-600 text-lg" />
                <span className="text-base">Giảm tối đa: <strong className="text-lg text-amber-850">{(voucher.maxDiscountAmount ?? 0).toLocaleString()}đ</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Grid for Metadata */}
        <div className="space-y-6">
          {/* Hàng 1: Hạng thành viên áp dụng & Lượt sử dụng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Applicable Tier */}
            <div className="bg-gray-50/60 p-6 rounded-[20px] border border-gray-100/80 shadow-xs flex items-center justify-between min-h-[92px]">
              <span className="text-base font-black text-gray-550 uppercase flex items-center gap-3">
                <TrophyOutlined className="text-amber-500 text-lg" /> Hạng thành viên áp dụng
              </span>
              <span>
                {voucher.applicableTier === 'VIP' ? (
                  <span className="px-4.5 py-2 text-xs font-black tracking-wide rounded-xl bg-amber-50 text-amber-850 border border-amber-200 uppercase">
                    Chỉ Thành viên VIP
                  </span>
                ) : voucher.applicableTier === 'MEMBER' ? (
                  <span className="px-4.5 py-2 text-xs font-black tracking-wide rounded-xl bg-orange-50 text-orange-850 border border-orange-200 uppercase">
                    Thành viên trở lên
                  </span>
                ) : (
                  <span className="px-4.5 py-2 text-xs font-black tracking-wide rounded-xl bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                    Tất cả khách hàng
                  </span>
                )}
              </span>
            </div>

            {/* Progress Tracker */}
            <div className="bg-gray-50/60 p-6 rounded-[20px] border border-gray-100/80 shadow-xs space-y-4 min-h-[92px] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-base font-black text-gray-550 uppercase flex items-center gap-3">
                  <InboxOutlined className="text-amber-600 text-lg" /> Lượt sử dụng
                </span>
                <span className="text-base font-black text-gray-800">
                  {voucher.currentUsageCount} / {voucher.maxUsageCount} lượt
                </span>
              </div>
              <Progress 
                percent={usagePercent} 
                strokeColor={{
                  '0%': '#f59e0b',
                  '100%': '#d97706',
                }}
                size={14}
                status={usagePercent >= 100 ? 'normal' : 'active'}
                className="mb-0"
              />
            </div>
          </div>

          {/* Hàng 2: Thời gian áp dụng */}
          <div className="bg-gray-50/60 p-6 rounded-[20px] border border-gray-100/80 shadow-xs space-y-5">
            <span className="text-base font-black text-gray-555 uppercase flex items-center gap-3">
              <CalendarOutlined className="text-amber-600 text-lg" /> Thời gian áp dụng
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày bắt đầu</p>
                <p className="text-lg text-gray-850 font-black mt-1.5">{validFromStr}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày kết thúc</p>
                <p className="text-lg text-gray-850 font-black mt-1.5">{validUntilStr}</p>
              </div>
            </div>
          </div>

          {/* Hàng 3: Thông tin hệ thống */}
          <div className="bg-gray-50/60 p-6 rounded-[20px] border border-gray-100/80 shadow-xs space-y-5">
            <span className="text-base font-black text-gray-555 uppercase flex items-center gap-3">
              <SafetyCertificateOutlined className="text-amber-600 text-lg" /> Thông tin hệ thống
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mã định danh (ID)</p>
                <p className="text-base text-gray-850 font-black truncate mt-1.5 block w-full" title={voucher.id}>
                  {voucher.id}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày khởi tạo</p>
                <p className="text-lg text-gray-850 font-black mt-1.5">
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
