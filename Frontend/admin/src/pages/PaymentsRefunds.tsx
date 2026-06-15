import React, { useState } from 'react';
import { Card, Table, Tabs, Input, Select, DatePicker, Tag, Button, Space, Tooltip } from 'antd';
import { CreditCardOutlined, HistoryOutlined, RedoOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { UserResolver } from '@/components/payment/UserResolver';
import { RefundModal } from '@/components/payment/RefundModal';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const PaymentsRefunds: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds'>('payments');

  // Payments List States
  const [payPage, setPayPage] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);
  const [payOrderCode, setPayOrderCode] = useState<string | undefined>();
  const [payStatus, setPayStatus] = useState<string | undefined>();
  const [payMethod, setPayMethod] = useState<string | undefined>();
  const [payDateRange, setPayDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Refunds List States
  const [refPage, setRefPage] = useState(1);
  const [refPageSize, setRefPageSize] = useState(10);
  const [refStatus, setRefStatus] = useState<string | undefined>();
  const [refDateRange, setRefDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [refOrderId, setRefOrderId] = useState<string | undefined>();
  const [refPaymentId, setRefPaymentId] = useState<string | undefined>();
  const [refUserId, setRefUserId] = useState<string | undefined>();
  const [refRequestedBy, setRefRequestedBy] = useState<string | undefined>();

  // Refund Modal State
  const [selectedPayment, setSelectedPayment] = useState<{ id: string; orderCode: string; amount: number; refundedAmount?: number; orderStatus?: string } | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Load Payments Query
  const { data: paymentsRes, isLoading: isPaymentsLoading } = useQuery({
    queryKey: [
      'payments',
      payPage,
      payPageSize,
      payOrderCode,
      payStatus,
      payMethod,
      payDateRange?.[0]?.toISOString(),
      payDateRange?.[1]?.toISOString(),
    ],
    queryFn: () =>
      paymentService.getPayments({
        page: payPage - 1,
        size: payPageSize,
        orderCode: payOrderCode || undefined,
        status: payStatus || undefined,
        paymentMethod: payMethod || undefined,
        createdFrom: payDateRange?.[0] ? payDateRange[0].startOf('day').toISOString() : undefined,
        createdTo: payDateRange?.[1] ? payDateRange[1].endOf('day').toISOString() : undefined,
        sort: 'createdAt,desc',
      }),
  });

  // Load Refunds Query
  const { data: refundsRes, isLoading: isRefundsLoading } = useQuery({
    queryKey: [
      'refunds',
      refPage,
      refPageSize,
      refStatus,
      refDateRange?.[0]?.toISOString(),
      refDateRange?.[1]?.toISOString(),
      refOrderId,
      refPaymentId,
      refUserId,
      refRequestedBy,
    ],
    queryFn: () =>
      paymentService.getRefunds({
        page: refPage - 1,
        size: refPageSize,
        status: refStatus || undefined,
        orderId: refOrderId || undefined,
        paymentId: refPaymentId || undefined,
        userId: refUserId || undefined,
        requestedBy: refRequestedBy || undefined,
        createdFrom: refDateRange?.[0] ? refDateRange[0].startOf('day').toISOString() : undefined,
        createdTo: refDateRange?.[1] ? refDateRange[1].endOf('day').toISOString() : undefined,
        sort: 'createdAt,desc',
      }),
  });

  const handleOpenRefundModal = (paymentId: string, orderCode: string, amount: number, refundedAmount?: number, orderStatus?: string) => {
    setSelectedPayment({ id: paymentId, orderCode, amount, refundedAmount, orderStatus });
    setIsRefundModalOpen(true);
  };

  const paymentColumns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ ĐƠN</span>,
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (code: string) => <span className="font-bold text-gray-800">{code}</span>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">KHÁCH HÀNG</span>,
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => <UserResolver userId={userId} />,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">SỐ TIỀN</span>,
      dataIndex: 'amount',
      key: 'amount',
      render: (amt: number) => <b className="text-gray-800">{amt?.toLocaleString()}đ</b>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI ĐƠN</span>,
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (orderStatus: string) => {
        let color = '';
        let label = orderStatus || 'PENDING';
        switch (orderStatus) {
          case 'PENDING':
            color = 'bg-gray-100 text-gray-500';
            label = 'CHỜ XỬ LÝ';
            break;
          case 'CONFIRMED':
            color = 'bg-blue-50 text-blue-700';
            label = 'ĐÃ XÁC NHẬN';
            break;
          case 'PREPARING':
            color = 'bg-amber-50 text-amber-700';
            label = 'ĐANG PHA CHẾ';
            break;
          case 'DELIVERING':
            color = 'bg-purple-50 text-purple-700';
            label = 'ĐANG GIAO';
            break;
          case 'COMPLETED':
            color = 'bg-emerald-50 text-emerald-700';
            label = 'HOÀN THÀNH';
            break;
          case 'CANCELLED':
            color = 'bg-rose-50 text-rose-700';
            label = 'ĐÃ HỦY';
            break;
          default:
            color = 'bg-gray-50 text-gray-600';
        }
        return (
          <Tag className={`font-extrabold rounded-lg px-2.5 py-0.5 text-[10px] border-none ${color}`}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">PHƯƠNG THỨC</span>,
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => (
        <Tag className="font-extrabold text-[10px] rounded-lg border-none px-2 py-0.5" color={method === 'VNPAY' ? 'blue' : 'orange'}>
          {method}
        </Tag>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI GD</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        // Phát hiện lỗi đối soát (thanh toán thành công cho đơn đã hủy)
        const isDisputed = status === 'SUCCESS' && record.orderStatus === 'CANCELLED';

        if (isDisputed) {
          return (
            <Tooltip title="Khách hàng đã thanh toán thành công sau khi đơn hàng bị hủy. Cần hoàn tiền ngay!">
              <Tag className="font-extrabold rounded-lg px-2.5 py-0.5 text-[10px] border-none bg-red-100 text-red-700 animate-pulse">
                ĐÃ THANH TOÁN (CẦN HOÀN TIỀN)
              </Tag>
            </Tooltip>
          );
        }

        let color = '';
        let label = status;
        switch (status) {
          case 'SUCCESS':
            color = 'bg-emerald-50 text-emerald-700';
            label = 'THÀNH CÔNG';
            break;
          case 'PENDING':
            color = 'bg-amber-50 text-amber-700';
            label = 'CHỜ GIAO DỊCH';
            break;
          case 'FAILED':
            color = 'bg-rose-50 text-rose-700';
            label = 'THẤT BẠI';
            break;
          case 'EXPIRED':
            color = 'bg-gray-100 text-gray-500';
            label = 'QUÁ HẠN';
            break;
          default:
            color = 'bg-gray-50 text-gray-600';
        }
        return (
          <Tag className={`font-extrabold rounded-lg px-2.5 py-0.5 text-[10px] border-none ${color}`}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ GIAO DỊCH VNPAY</span>,
      dataIndex: 'transactionId',
      key: 'transactionId',
      render: (txId: string) => txId ? <Text code className="text-xs">{txId}</Text> : <span className="text-gray-300">-</span>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THỜI GIAN</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THAO TÁC</span>,
      key: 'action',
      render: (_: any, record: any) => {
        const isSuccess = record.status === 'SUCCESS';
        const isVnPay = record.paymentMethod === 'VNPAY';
        const refundedAmt = record.refundedAmount || 0;
        const totalAmt = record.amount || 0;

        // Trạng thái đã từng hoàn tiền (dù một phần hay toàn bộ)
        const hasRefunded = refundedAmt > 0;
        const isFullyRefunded = refundedAmt >= totalAmt;
        const isPartiallyRefunded = refundedAmt > 0 && refundedAmt < totalAmt;

        // Chỉ cho phép hoàn tiền tối đa 1 lần nếu chưa từng có giao dịch hoàn tiền thành công
        const canRefund = isSuccess && isVnPay && !hasRefunded;
        const isDisputed = isSuccess && record.orderStatus === 'CANCELLED' && !hasRefunded;

        return (
          <Space direction="vertical" size={2} className="w-full">
            {isFullyRefunded && (
              <Tag className="font-extrabold text-[10px] rounded-lg px-2.5 py-0.5 border-none bg-gray-100 text-gray-400">
                ĐÃ HOÀN TIỀN
              </Tag>
            )}

            {isPartiallyRefunded && (
              <Tooltip title={`Đã đền bù/hoàn trả một phần: ${refundedAmt.toLocaleString()}đ (Tổng thanh toán gốc: ${totalAmt.toLocaleString()}đ)`}>
                <Tag className="font-extrabold text-[10px] rounded-lg px-2.5 py-0.5 border-none bg-amber-50 text-amber-700">
                  ĐÃ HOÀN MỘT PHẦN
                </Tag>
              </Tooltip>
            )}

            {canRefund && (
              <Button
                type="primary"
                danger={!isDisputed}
                size="small"
                icon={<RedoOutlined />}
                onClick={() => handleOpenRefundModal(record.id, record.orderCode, record.amount, record.refundedAmount, record.orderStatus)}
                className={`rounded-lg font-bold text-xs ${isDisputed
                  ? 'bg-amber-500 hover:bg-amber-600 border-none text-white animate-bounce'
                  : ''
                  }`}
              >
                {isDisputed ? 'Hoàn tiền khẩn cấp' : 'Hoàn tiền'}
              </Button>
            )}

            {!canRefund && !hasRefunded && (
              <span className="text-gray-300 text-xs">-</span>
            )}
          </Space>
        );
      },
    },
  ];

  const refundColumns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">ĐƠN HÀNG & GIAO DỊCH</span>,
      key: 'orderAndPayment',
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đơn:</span>
            <Tooltip title={`Copy ID Đơn: ${record.orderId}`}>
              <span className="font-mono text-xs text-gray-700 font-semibold cursor-pointer hover:text-blue-600" onClick={() => navigator.clipboard.writeText(record.orderId)}>
                {record.orderId ? `${record.orderId.substring(0, 8)}...` : '-'}
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Giao dịch:</span>
            <Tooltip title={`Copy ID Thanh toán: ${record.paymentId}`}>
              <span className="font-mono text-[11px] text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => navigator.clipboard.writeText(record.paymentId)}>
                {record.paymentId ? `${record.paymentId.substring(0, 8)}...` : '-'}
              </span>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">HOÀN CHO AI</span>,
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => (
        <div className="space-y-0.5">
          <UserResolver userId={userId} />
          {userId && (
            <Tooltip title="Copy User ID">
              <span
                className="block font-mono text-[10px] text-gray-400 cursor-pointer hover:text-blue-600"
                onClick={() => navigator.clipboard.writeText(userId)}
              >
                {userId.substring(0, 8)}...
              </span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TIỀN HOÀN</span>,
      dataIndex: 'amount',
      key: 'amount',
      render: (amt: number) => <b className="text-rose-600 text-sm">-{amt?.toLocaleString()}đ</b>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">LÝ DO</span>,
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => <span className="text-gray-600 text-xs font-semibold">{reason}</span>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag className="font-extrabold text-[10px] rounded-lg border-none px-2.5 py-0.5 bg-emerald-50 text-emerald-700">
          {status === 'COMPLETED' ? 'HOÀN THÀNH' : status}
        </Tag>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">AI HOÀN TIỀN (ADMIN)</span>,
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      render: (adminId: string) => (
        <div className="space-y-0.5">
          <UserResolver userId={adminId} fallbackText="Hệ thống" />
          {adminId && (
            <Tooltip title="Copy Admin ID">
              <span
                className="block font-mono text-[10px] text-gray-400 cursor-pointer hover:text-blue-600"
                onClick={() => navigator.clipboard.writeText(adminId)}
              >
                {adminId.substring(0, 8)}...
              </span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THỜI GIAN HOÀN</span>,
      dataIndex: 'processedAt',
      key: 'processedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Thanh toán & Hoàn tiền</h2>
      </div>

      <div className="border-b border-gray-100 pb-1">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          size="large"
          className="border-none mb-0"
          items={[
            {
              key: 'payments',
              label: (
                <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                  <CreditCardOutlined />
                  Lịch sử Giao dịch
                </span>
              ),
            },
            {
              key: 'refunds',
              label: (
                <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                  <HistoryOutlined />
                  Lịch sử Hoàn tiền
                </span>
              ),
            },
          ]}
        />
      </div>

      {activeTab === 'payments' ? (
        <div className="space-y-4">
          {/* Filters Payments */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Input.Search
              placeholder="Tìm theo mã đơn hàng..."
              allowClear
              className="w-full sm:w-64 rounded-xl"
              onSearch={(val) => {
                setPayOrderCode(val);
                setPayPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setPayOrderCode(undefined);
                  setPayPage(1);
                }
              }}
            />
            <Select
              placeholder="Trạng thái thanh toán"
              allowClear
              className="w-full sm:w-48"
              popupClassName="rounded-xl"
              onChange={(val) => {
                setPayStatus(val);
                setPayPage(1);
              }}
              options={[
                { value: 'SUCCESS', label: 'THÀNH CÔNG' },
                { value: 'PENDING', label: 'ĐANG CHỜ' },
                { value: 'FAILED', label: 'THẤT BẠI' },
                { value: 'EXPIRED', label: 'QUÁ HẠN' },
              ]}
            />
            <Select
              placeholder="Phương thức"
              allowClear
              className="w-full sm:w-40"
              popupClassName="rounded-xl"
              onChange={(val) => {
                setPayMethod(val);
                setPayPage(1);
              }}
              options={[
                { value: 'VNPAY', label: 'VNPAY' },
                { value: 'COD', label: 'COD' },
              ]}
            />
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              className="w-full sm:w-64 rounded-xl"
              onChange={(values) => {
                setPayDateRange(values as any);
                setPayPage(1);
              }}
            />
          </div>

          <Card variant="borderless" className="rounded-3xl shadow-sm border border-gray-100 p-2 overflow-hidden">
            <Table
              columns={paymentColumns}
              dataSource={paymentsRes?.data || []}
              rowKey="id"
              loading={isPaymentsLoading}
              scroll={{ x: 'max-content' }}
              pagination={{
                current: payPage,
                pageSize: payPageSize,
                total: paymentsRes?.totalElements || 0,
                onChange: (page, size) => {
                  setPayPage(page);
                  if (size) setPayPageSize(size);
                },
                showSizeChanger: true,
              }}
            />
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters Refunds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Input.Search
              placeholder="Mã đơn hàng (Order ID)..."
              allowClear
              className="w-full rounded-xl"
              onSearch={(val) => {
                setRefOrderId(val || undefined);
                setRefPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setRefOrderId(undefined);
                  setRefPage(1);
                }
              }}
            />
            <Input.Search
              placeholder="Mã thanh toán (Payment ID)..."
              allowClear
              className="w-full rounded-xl"
              onSearch={(val) => {
                setRefPaymentId(val || undefined);
                setRefPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setRefPaymentId(undefined);
                  setRefPage(1);
                }
              }}
            />
            <Input.Search
              placeholder="Mã khách hàng (User ID)..."
              allowClear
              className="w-full rounded-xl"
              onSearch={(val) => {
                setRefUserId(val || undefined);
                setRefPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setRefUserId(undefined);
                  setRefPage(1);
                }
              }}
            />
            <Input.Search
              placeholder="Mã người duyệt (Admin ID)..."
              allowClear
              className="w-full rounded-xl"
              onSearch={(val) => {
                setRefRequestedBy(val || undefined);
                setRefPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setRefRequestedBy(undefined);
                  setRefPage(1);
                }
              }}
            />
            <Select
              placeholder="Trạng thái hoàn tiền"
              allowClear
              className="w-full"
              popupClassName="rounded-xl"
              onChange={(val) => {
                setRefStatus(val);
                setRefPage(1);
              }}
              options={[
                { value: 'COMPLETED', label: 'HOÀN THÀNH' },
                { value: 'PENDING', label: 'ĐANG CHỜ' },
                { value: 'FAILED', label: 'THẤT BẠI' },
              ]}
            />
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              className="w-full rounded-xl"
              onChange={(values) => {
                setRefDateRange(values as any);
                setRefPage(1);
              }}
            />
          </div>

          <Card variant="borderless" className="rounded-3xl shadow-sm border border-gray-100 p-2 overflow-hidden">
            <Table
              columns={refundColumns}
              dataSource={refundsRes?.data || []}
              rowKey="id"
              loading={isRefundsLoading}
              scroll={{ x: 'max-content' }}
              pagination={{
                current: refPage,
                pageSize: refPageSize,
                total: refundsRes?.totalElements || 0,
                onChange: (page, size) => {
                  setRefPage(page);
                  if (size) setRefPageSize(size);
                },
                showSizeChanger: true,
              }}
            />
          </Card>
        </div>
      )}

      {selectedPayment && (
        <RefundModal
          paymentId={selectedPayment.id}
          orderCode={selectedPayment.orderCode}
          maxAmount={selectedPayment.amount - (selectedPayment.refundedAmount || 0)}
          isFixedAmount={selectedPayment.orderStatus === 'CANCELLED'}
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
};

// Custom text code element styling fallback
const Text: React.FC<{ children: React.ReactNode; code?: boolean; className?: string }> = ({ children, code, className }) => {
  if (code) {
    return (
      <code className={`px-1.5 py-0.5 rounded bg-gray-100 text-red-500 font-mono text-[11px] ${className}`}>
        {children}
      </code>
    );
  }
  return <span className={className}>{children}</span>;
};

export default PaymentsRefunds;
