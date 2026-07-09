import React, { useState } from 'react';
import { Card, Table, Tabs, Input, Select, DatePicker, Tag, Button, Space, Tooltip, Drawer, Descriptions } from 'antd';
import { CreditCardOutlined, HistoryOutlined, RedoOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
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
  const [refOrderCode, setRefOrderCode] = useState<string | undefined>();
  const [refRecipientType, setRefRecipientType] = useState<string | undefined>();

  // Refund Detail Drawer States
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Refund Modal State
  const [selectedPayment, setSelectedPayment] = useState<{ id: string; orderCode: string; amount: number; refundedAmount?: number; orderStatus?: string } | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundRecipientType, setRefundRecipientType] = useState<'CUSTOMER' | 'SHIPPER'>('CUSTOMER');

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
      refOrderCode,
      refRecipientType,
    ],
    queryFn: () =>
      paymentService.getRefunds({
        page: refPage - 1,
        size: refPageSize,
        status: refStatus || undefined,
        orderCode: refOrderCode || undefined,
        recipientType: refRecipientType || undefined,
        createdFrom: refDateRange?.[0] ? refDateRange[0].startOf('day').toISOString() : undefined,
        createdTo: refDateRange?.[1] ? refDateRange[1].endOf('day').toISOString() : undefined,
        sort: 'createdAt,desc',
      }),
  });

  const handleOpenRefundModal = (
    paymentId: string,
    orderCode: string,
    amount: number,
    refundedAmount?: number,
    orderStatus?: string,
    recipientType: 'CUSTOMER' | 'SHIPPER' = 'CUSTOMER'
  ) => {
    setSelectedPayment({ id: paymentId, orderCode, amount, refundedAmount, orderStatus });
    setRefundRecipientType(recipientType);
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
          case 'BOOMED':
            color = 'bg-red-50 text-red-700';
            label = 'ĐƠN BỊ BOM';
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
          case 'PAID_BY_SHIPPER':
            color = 'bg-orange-50 text-orange-700';
            label = 'ĐÃ ỨNG TIỀN';
            break;
          case 'REFUNDED':
            color = 'bg-gray-100 text-gray-500';
            label = 'ĐÃ HOÀN TIỀN';
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

        // Đơn hàng COD bị bom (orderStatus === 'BOOMED', paymentMethod === 'COD' và status === 'PAID_BY_SHIPPER')
        const canRefundShipper = record.paymentMethod === 'COD' && record.status === 'PAID_BY_SHIPPER' && record.orderStatus === 'BOOMED' && !hasRefunded;

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
                onClick={() => handleOpenRefundModal(record.id, record.orderCode, record.amount, record.refundedAmount, record.orderStatus, 'CUSTOMER')}
                className={`rounded-lg font-bold text-xs ${isDisputed
                  ? 'bg-amber-500 hover:bg-amber-600 border-none text-white animate-bounce'
                  : ''
                  }`}
              >
                {isDisputed ? 'Hoàn tiền khẩn cấp' : 'Hoàn tiền'}
              </Button>
            )}

            {canRefundShipper && (
              <Button
                type="primary"
                size="small"
                icon={<RedoOutlined />}
                onClick={() => handleOpenRefundModal(record.id, record.orderCode, record.amount, record.refundedAmount, record.orderStatus, 'SHIPPER')}
                className="rounded-lg font-bold text-xs bg-orange-600 hover:bg-orange-700 border-none text-white animate-bounce"
              >
                Hoàn tiền Shipper
              </Button>
            )}

            {!canRefund && !canRefundShipper && !hasRefunded && (
              <span className="text-gray-300 text-xs">-</span>
            )}
          </Space>
        );
      },
    },
  ];

  const refundColumns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ ĐƠN</span>,
      key: 'orderCode',
      render: (_: any, record: any) => (
        <span className="font-bold text-gray-800">{record.orderCode || '-'}</span>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">HOÀN CHO AI</span>,
      key: 'recipient',
      render: (_: any, record: any) => {
        if (record.recipientType === 'SHIPPER') {
          return (
            <div className="space-y-0.5">
              <Tag color="orange" className="font-extrabold text-[9px] rounded-lg border-none px-2 py-0.5">🚚 SHIPPER</Tag>
              <div className="font-bold text-gray-800 text-xs">{record.shipperName || 'Không rõ tên'}</div>
              <div className="text-gray-500 text-[10px] font-mono">{record.shipperPhone || '-'}</div>
            </div>
          );
        }
        return (
          <div className="space-y-0.5">
            <UserResolver userId={record.userId} showEmail={false} />
          </div>
        );
      },
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
        <UserResolver userId={adminId} fallbackText="Hệ thống" showEmail={false} />
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THỜI GIAN HOÀN</span>,
      dataIndex: 'processedAt',
      key: 'processedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THAO TÁC</span>,
      key: 'actions',
      render: (_: any, record: any) => (
        <Tooltip title="Xem chi tiết hoàn tiền">
          <Button
            type="text"
            shape="circle"
            icon={<EyeOutlined className="text-blue-500 hover:text-blue-700 text-base" />}
            onClick={() => {
              setSelectedRefund(record);
              setIsDetailDrawerOpen(true);
            }}
          />
        </Tooltip>
      ),
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
            <Input
              placeholder="Tìm theo mã đơn hàng..."
              allowClear
              value={payOrderCode}
              onChange={(e) => {
                setPayOrderCode(e.target.value || undefined);
                setPayPage(1);
              }}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-full sm:w-64 rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-primary focus:bg-white transition-all"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Input
              placeholder="Tìm theo mã đơn hàng..."
              allowClear
              value={refOrderCode}
              onChange={(e) => {
                setRefOrderCode(e.target.value || undefined);
                setRefPage(1);
              }}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-full rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-primary focus:bg-white transition-all"
            />
            <Select
              placeholder="Đối tượng nhận hoàn"
              allowClear
              className="w-full"
              popupClassName="rounded-xl"
              onChange={(val) => {
                setRefRecipientType(val);
                setRefPage(1);
              }}
              options={[
                { value: 'CUSTOMER', label: 'KHÁCH HÀNG' },
                { value: 'SHIPPER', label: 'SHIPPER' },
              ]}
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
          isFixedAmount={selectedPayment.orderStatus === 'CANCELLED' || selectedPayment.orderStatus === 'BOOMED'}
          recipientType={refundRecipientType}
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}

      {/* Refund Detail Drawer */}
      <Drawer
        title={<span className="font-black text-gray-800 uppercase tracking-wide">Chi tiết hoàn tiền</span>}
        placement="right"
        size={500}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedRefund(null);
        }}
        open={isDetailDrawerOpen}
      >
        {selectedRefund && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Mã đơn hàng</span>
                <span className="text-sm font-bold text-gray-800">{selectedRefund.orderCode || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block text-right">Trạng thái</span>
                <Tag className="font-extrabold text-[10px] rounded-lg border-none px-2.5 py-0.5 bg-emerald-50 text-emerald-700 m-0">
                  {selectedRefund.status === 'COMPLETED' ? 'HOÀN THÀNH' : selectedRefund.status}
                </Tag>
              </div>
            </div>

            <Descriptions title={<span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-2">Thông tin hoàn tiền</span>} column={1} bordered size="small" className="bg-white rounded-xl overflow-hidden">
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Mã hoàn tiền (ID)</span>}>
                <code className="text-[11px] bg-gray-50 px-1 py-0.5 rounded font-mono text-gray-700">{selectedRefund.id}</code>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Mã thanh toán (ID)</span>}>
                <code className="text-[11px] bg-gray-50 px-1 py-0.5 rounded font-mono text-gray-700">{selectedRefund.paymentId}</code>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Số tiền hoàn</span>}>
                <b className="text-rose-600 text-sm">{selectedRefund.amount?.toLocaleString()}đ</b>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Lý do hoàn tiền</span>}>
                <span className="text-gray-700 font-medium text-xs">{selectedRefund.reason}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Thời gian hoàn</span>}>
                <span className="text-gray-700 text-xs">{dayjs(selectedRefund.processedAt).format('DD/MM/YYYY HH:mm:ss')}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Mã giao dịch đối tác</span>}>
                <span className="text-gray-700 font-mono text-[11px]">{selectedRefund.transactionId || '-'}</span>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title={<span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-2">Người nhận hoàn tiền</span>} column={1} bordered size="small" className="bg-white rounded-xl overflow-hidden">
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Đối tượng</span>}>
                <Tag color={selectedRefund.recipientType === 'SHIPPER' ? 'orange' : 'blue'} className="font-bold text-[9px] rounded px-2 py-0.5 border-none m-0">
                  {selectedRefund.recipientType === 'SHIPPER' ? '🚚 SHIPPER' : '👤 KHÁCH HÀNG'}
                </Tag>
              </Descriptions.Item>
              {selectedRefund.recipientType === 'SHIPPER' ? (
                <>
                  <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Tên Shipper</span>}>
                    <span className="text-gray-800 font-bold text-xs">{selectedRefund.shipperName || 'Không rõ tên'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Số điện thoại</span>}>
                    <span className="text-gray-700 font-mono text-xs">{selectedRefund.shipperPhone || '-'}</span>
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Thông tin khách hàng</span>}>
                  <UserResolver userId={selectedRefund.userId} />
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions title={<span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-2">Người thực hiện</span>} column={1} bordered size="small" className="bg-white rounded-xl overflow-hidden">
              <Descriptions.Item label={<span className="font-semibold text-gray-600 text-xs">Tài khoản Admin</span>}>
                <UserResolver userId={selectedRefund.requestedBy} fallbackText="Hệ thống" />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
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
