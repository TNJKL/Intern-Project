import React, { useState } from 'react';
import { Drawer, Descriptions, Table, Typography, Spin, Divider, Select, Button, Tag } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { useOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { message } from '@/lib/antd';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { RefundModal } from '@/components/payment/RefundModal';
import { UserResolver } from '@/components/payment/UserResolver';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface OrderDetailDrawerProps {
  orderId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ orderId, isOpen, onClose }) => {
  const { data: response, isLoading } = useOrder(orderId);
  const order = response?.data;
  const updateStatusMutation = useUpdateOrderStatus();

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () => paymentService.getPayments({ orderId }),
    enabled: !!orderId && isOpen,
  });

  const payment = paymentsData?.data?.[0];

  const { data: refundsData } = useQuery({
    queryKey: ['refunds', 'payment', payment?.id],
    queryFn: () => paymentService.getRefunds({ paymentId: payment!.id }),
    enabled: !!payment?.id,
  });

  const refunds = refundsData?.data || [];
  const totalRefunded = refunds
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.amount, 0);
  const remainingRefundable = payment ? payment.amount - totalRefunded : 0;

  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Kích cỡ',
      dataIndex: 'variantLabel',
      key: 'variantLabel',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val: number) => `${val?.toLocaleString() ?? 0}đ`,
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (val: number) => <Text strong>{val?.toLocaleString() ?? 0}đ</Text>,
    },
  ];

  return (
    <Drawer
      title={<span className="font-black text-gray-800 uppercase tracking-wide">Chi tiết đơn hàng</span>}
      placement="right"
      size={600}
      onClose={onClose}
      open={isOpen}
      styles={{ body: { paddingBottom: 80 } }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
            <div>
              <Text type="secondary" className="text-xs uppercase tracking-widest font-bold">Mã đơn hàng</Text>
              <div className="text-lg font-black text-gray-800 mt-1">{order.orderCode}</div>
            </div>
            <div className="text-left flex flex-col items-start gap-1">
              <Text type="secondary" className="text-xs uppercase tracking-widest font-bold">Trạng thái</Text>
              <Select
                value={order.status}
                onChange={async (value) => {
                  try {
                    await updateStatusMutation.mutateAsync({ id: order.id, status: value });
                    message.success('Cập nhật trạng thái đơn hàng thành công');
                  } catch {
                    message.error('Cập nhật trạng thái đơn hàng thất bại');
                  }
                }}
                loading={updateStatusMutation.isPending}
                disabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                style={{ width: 170, fontWeight: 'bold' }}
                className="font-bold text-sm"
                options={[
                  { value: 'PENDING', label: 'ĐÃ NHẬN ĐƠN' },
                  { value: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN' },
                  { value: 'PREPARING', label: 'ĐANG PHA CHẾ' },
                  { value: 'DELIVERING', label: 'ĐANG GIAO' },
                  { value: 'COMPLETED', label: 'HOÀN THÀNH' },
                  { value: 'CANCELLED', label: 'ĐÃ HỦY' },
                ]}
              />
            </div>
          </div>

          <div>
            <Title level={5} className="!mb-4 uppercase text-sm tracking-widest text-gray-500">Thông tin khách hàng</Title>
            <Descriptions column={2} size="small" bordered className="bg-white">
              <Descriptions.Item label="Loại khách" span={2}>
                {order.userId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                    Thành viên
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                    Khách vãng lai
                  </span>
                )}
              </Descriptions.Item>
              {order.userId && (
                <Descriptions.Item label="User ID" span={2}>
                  <Text code copyable className="text-xs">{order.userId}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Người đặt" span={2}><Text strong>{order.userName || order.userEmail || 'Khách vãng lai'}</Text></Descriptions.Item>
              {order.userEmail && (
                <Descriptions.Item label="Email" span={2}>{order.userEmail}</Descriptions.Item>
              )}
              <Descriptions.Item label="Số điện thoại" span={2}>{order.userPhone}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao hàng" span={2}>{order.deliveryAddress}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>{order.note || <Text type="secondary">Không có</Text>}</Descriptions.Item>
              {order.status === 'CANCELLED' && order.cancellationReason && (
                <Descriptions.Item label="Lý do hủy đơn" span={2}>
                  <Text className="font-extrabold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 inline-block w-full">
                    {order.cancellationReason}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          {/* Thông tin Thanh toán & Hoàn tiền */}
          <div>
            <Title level={5} className="!mb-4 uppercase text-sm tracking-widest text-gray-500">Thông tin Thanh toán</Title>
            {isPaymentsLoading ? (
              <Spin size="small" />
            ) : payment ? (
              <div className="space-y-3">
                <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="grid grid-cols-2">
                    {/* Ô 1: Phương thức thanh toán */}
                    <div className="col-span-2 sm:col-span-1 bg-gray-50/20 border-r border-b border-black p-3.5 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Phương thức thanh toán</span>
                      <span className="font-bold text-gray-800 text-sm">
                        {payment.paymentMethod === 'VNPAY' ? '💳 VNPay (Cổng thanh toán)' : '💵 Tiền mặt khi nhận hàng (COD)'}
                      </span>
                    </div>

                    {/* Ô 2: Trạng thái thanh toán */}
                    <div className="col-span-2 sm:col-span-1 bg-gray-50/20 border-b border-black p-3.5 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Trạng thái thanh toán</span>
                      {(() => {
                        let color = '';
                        let label = payment.status as string;
                        switch (payment.status) {
                          case 'SUCCESS':
                            color = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                            label = 'THÀNH CÔNG';
                            break;
                          case 'PENDING':
                            color = 'bg-amber-50 text-amber-700 border border-amber-100';
                            label = 'CHỜ THANH TOÁN';
                            break;
                          case 'FAILED':
                            color = 'bg-rose-50 text-rose-700 border border-rose-100';
                            label = 'THẤT BẠI';
                            break;
                          case 'EXPIRED':
                            color = 'bg-gray-100 text-gray-500 border border-gray-200';
                            label = 'QUÁ HẠN';
                            break;
                        }
                        return (
                          <span className={`font-extrabold rounded-lg px-2.5 py-0.5 text-xs text-center inline-block w-fit ${color}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Ô 3: Số tiền giao dịch */}
                    <div className="col-span-2 sm:col-span-1 bg-gray-50/20 border-r border-b border-black p-3.5 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Số tiền giao dịch</span>
                      <span className="text-base font-black text-gray-800">{payment.amount?.toLocaleString()}đ</span>
                    </div>

                    {/* Ô 4: Thời gian thanh toán */}
                    <div className="col-span-2 sm:col-span-1 bg-gray-50/20 border-b border-black p-3.5 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Thời gian thanh toán</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {payment.paidAt ? dayjs(payment.paidAt).format('DD/MM/YYYY HH:mm') : <span className="text-gray-400 italic">Chưa thanh toán</span>}
                      </span>
                    </div>

                    {/* Ô 5: Mã giao dịch (nếu có) */}
                    {payment.transactionId && (
                      <div className="col-span-2 bg-gray-50/20 border-b border-black p-3.5 flex flex-col justify-center">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Mã giao dịch</span>
                        <Text code copyable className="text-xs w-fit bg-white border border-gray-100 px-2 py-0.5 rounded">{payment.transactionId}</Text>
                      </div>
                    )}

                    {/* Ô 6: Trạng thái hoàn tiền (chỉ hiển thị cho đơn VNPAY) */}
                    {payment.paymentMethod === 'VNPAY' && (
                      <div className="col-span-2 bg-gray-50/20 p-3.5 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Trạng thái hoàn trả</span>
                          {(() => {
                            let statusColor = 'text-gray-500 bg-gray-100 border border-gray-200';
                            let statusLabel = 'CHƯA HOÀN TIỀN';
                            if (totalRefunded > 0) {
                              if (remainingRefundable === 0) {
                                statusColor = 'text-rose-700 bg-rose-50 border border-rose-100';
                                statusLabel = 'ĐÃ HOÀN ĐỦ TIỀN';
                              } else {
                                statusColor = 'text-amber-700 bg-amber-50 border-amber-100';
                                statusLabel = 'ĐÃ HOÀN TIỀN MỘT PHẦN';
                              }
                            }
                            return (
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${statusColor}`}>
                                {statusLabel}
                              </span>
                            );
                          })()}
                        </div>
                        {totalRefunded > 0 && (
                          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-dashed border-gray-200/80">
                            <span className="font-semibold text-gray-500">Số tiền đã hoàn:</span>
                            <span className="font-black text-rose-600">-{totalRefunded?.toLocaleString()}đ</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nút Hoàn tiền */}
                {payment.status === 'SUCCESS' && payment.paymentMethod === 'VNPAY' && (
                  <div className="pt-2 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                    <div>
                      <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Số tiền có thể hoàn trả</div>
                      <div className="text-sm font-black text-gray-800">{remainingRefundable?.toLocaleString()}đ</div>
                    </div>
                    {remainingRefundable > 0 ? (
                      <Button
                        type="primary"
                        danger
                        size="middle"
                        icon={<RedoOutlined />}
                        onClick={() => setIsRefundModalOpen(true)}
                        className="rounded-xl font-bold text-xs"
                      >
                        Hoàn tiền
                      </Button>
                    ) : (
                      <Tag className="font-extrabold text-[10px] rounded-lg border-none px-2.5 py-1 bg-gray-100 text-gray-400">
                        ĐÃ HOÀN ĐỦ TIỀN
                      </Tag>
                    )}
                  </div>
                )}

                {/* Danh sách hoàn tiền cũ */}
                {refunds.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="text-xs font-black text-gray-500 uppercase tracking-wider">Lịch sử hoàn tiền</div>
                    <div className="space-y-2">
                      {refunds.map((ref) => (
                        <div key={ref.id} className="bg-red-50/20 border border-red-100/50 rounded-xl p-3 text-xs flex justify-between items-center">
                          <div className="space-y-1">
                            <div>
                              Số tiền hoàn: <b className="text-rose-600">-{ref.amount?.toLocaleString()}đ</b>
                            </div>
                            <div className="text-gray-500 font-medium">Lý do: {ref.reason}</div>
                            <div className="text-[10px] text-gray-400">
                              Người duyệt: <UserResolver userId={ref.requestedBy} fallbackText="Hệ thống" />
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <Tag className="font-extrabold text-[9px] rounded-lg border-none px-2 py-0.5 bg-emerald-50 text-emerald-700">
                              THÀNH CÔNG
                            </Tag>
                            <div className="text-[9px] text-gray-400">
                              {dayjs(ref.processedAt).format('DD/MM/YYYY HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                Không có dữ liệu thanh toán trực tuyến cho đơn hàng này (COD hoặc giao dịch chưa tạo).
              </div>
            )}
          </div>

          <div>
            <Title level={5} className="!mb-4 uppercase text-sm tracking-widest text-gray-500">Chi tiết sản phẩm</Title>
            <Table
              dataSource={order.items || []}
              columns={itemColumns}
              pagination={false}
              rowKey="id"
              size="small"
              bordered
            />
          </div>

          <Divider />

          <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between">
              <Text>Tạm tính:</Text>
              <Text>{order.subtotal?.toLocaleString()}đ</Text>
            </div>
            <div className="flex justify-between">
              <Text>Phí giao hàng:</Text>
              <Text>15,000đ</Text>
            </div>
            <div className="flex justify-between text-green-600">
              <Text className="text-green-600">Khuyến mãi {order.voucherCode ? `(${order.voucherCode})` : ''}:</Text>
              <Text className="text-green-600">-{order.discountAmount?.toLocaleString() || 0}đ</Text>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <Text strong className="text-lg">Tổng thanh toán:</Text>
              <Text strong className="text-xl text-primary">{order.totalAmount?.toLocaleString()}đ</Text>
            </div>
          </div>

          <div className="text-right">
            <Text type="secondary" className="text-xs">Phương thức thanh toán: <Text strong>{order.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : order.paymentMethod}</Text></Text>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          Không tìm thấy thông tin đơn hàng
        </div>
      )}

      {payment && (
        <RefundModal
          paymentId={payment.id}
          orderCode={order?.orderCode}
          maxAmount={remainingRefundable}
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
        />
      )}
    </Drawer>
  );
};

export default OrderDetailDrawer;
