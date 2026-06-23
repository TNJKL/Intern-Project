// 📄 Vị trí file: src/features/common/BaseManagement.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { Card, Table, Space, Button, Modal, Descriptions, Tabs, Badge, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useManagement } from './hooks/useManagement';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import { ManagementHeader } from './components/ManagementHeader';
import { ManagementToolbar } from './components/ManagementToolbar';
import { message } from '@/lib/antd';

interface ExtraTab {
  key: string;
  label: ReactNode;
  content: ReactNode;
  badge?: number;
}

interface BaseManagementProps<T> {
  title: string;
  description: string;
  entityName: string;
  addButtonText: string;
  searchPlaceholder?: string;
  queryKey: string;
  service: any;
  columns: any[];
  ModalComponent: any;
  extraFilters?: any;
  modalExtraProps?: any;
  renderDetail?: (record: T) => ReactNode;
  formatSaveValues?: (values: any) => any;
  extraTabs?: ExtraTab[];
}

export const BaseManagement = <T extends { id: string }>({
  title, description, entityName, addButtonText, searchPlaceholder,
  queryKey, service, columns, ModalComponent, extraFilters, modalExtraProps,
  renderDetail, formatSaveValues, extraTabs
}: BaseManagementProps<T>) => {

  const { state, data, actions } = useManagement<T>(queryKey, service);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<T | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Chỉ điều chỉnh includeDeleted và pageSize cho các tab built-in
    const isExtraTab = extraTabs?.some(t => t.key === key);
    if (!isExtraTab) {
      state.setIncludeDeleted(key === 'deleted');
      state.setCurrentPage(1);
      state.setPageSize(key === 'deleted' ? 200 : 10);
    }
  };

  // Hàm kiểm tra bản ghi đã bị xóa mềm (thực sự nằm trong thùng rác)
  const isSoftDeletedRecord = (r: any) => {
    return !!(r.isDeleted || r.deleted || r.deletedAt || r.status === 'DELETED');
  };

  // Hàm kiểm tra bản ghi thuộc diện Không hoạt động / Đã xóa
  const isDeletedRecord = (r: any) => {
    const isDeleted = isSoftDeletedRecord(r);
    const isNotAvailable = r.isAvailable === false;
    const isNotActive = r.isActive === false;
    return isDeleted || isNotAvailable || isNotActive;
  };

  const displayRecords = extraFilters?.showDeletedFilter
    ? (activeTab === 'deleted'
      ? data.records.filter(isDeletedRecord)
      : data.records.filter((r: T) => !isDeletedRecord(r)))
    : data.records;

  // 🔄 ĐẾM SỐ LƯỢNG PHÍA CLIENT — ĐẢM BẢO ĐỒNG BỘ VỚI DỮ LIỆU HIỂN THỊ
  // Cách cũ dùng 2 lần gọi API với includeDeleted true/false rồi trừ nhau, nhưng sai
  // vì backend "includeDeleted" chỉ lọc record đã xóa mềm (deletedAt), không lọc isActive.
  // Cách mới: Lấy tất cả record 1 lần rồi đếm bằng cùng hàm isDeletedRecord() với bảng.

  const { data: countAllRes } = useReactQuery({
    queryKey: [
      queryKey,
      'count-all-for-tabs',
      state.searchText,
      state.selectedCategory,
      state.availability,
      state.featured
    ],
    queryFn: () => service.getAll({
      page: 0,
      size: 500,
      includeDeleted: true,
      keyword: state.searchText || undefined,
      categoryId: state.selectedCategory || undefined,
      isAvailable: state.availability !== undefined ? state.availability : undefined,
      isFeatured: state.featured !== undefined ? state.featured : undefined
    }),
    enabled: !!extraFilters?.showDeletedFilter,
  });

  // Trích xuất danh sách bản ghi từ response (hỗ trợ nhiều format API khác nhau)
  const allRecordsForCount = (() => {
    if (!countAllRes) return [];
    const raw = Array.isArray(countAllRes)
      ? countAllRes
      : ((countAllRes as any).data || (countAllRes as any).records || []);
    return Array.isArray(raw) ? raw : [];
  })();

  // Dùng cùng hàm isDeletedRecord() để đảm bảo badge khớp với dữ liệu bảng
  const activeCount = allRecordsForCount.filter((r: any) => !isDeletedRecord(r)).length;
  const deletedCount = allRecordsForCount.filter((r: any) => isDeletedRecord(r)).length;

  const handleView = (record: T) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleSave = (values: any) => {
    const finalValues = formatSaveValues ? formatSaveValues(values) : values;

    if (state.editingRecord) {
      actions.updateMutation.mutate({ id: state.editingRecord.id, data: finalValues }, {
        onSuccess: () => message.success(`Cập nhật ${entityName} thành công!`)
      });
    } else {
      actions.createMutation.mutate(finalValues, {
        onSuccess: () => message.success(`Tạo ${entityName} thành công!`)
      });
    }
  };

  const actionColumn = {
    title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">HÀNH ĐỘNG</span>,
    key: 'action',
    width: 150,
    render: (_: any, record: T) => {
      const isSoftDeleted = isSoftDeletedRecord(record);

      return (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleView(record);
            }}
            className="text-blue-500 hover:text-blue-600"
          />
          {!isSoftDeleted ? (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  state.setEditingRecord(record);
                  state.setIsModalOpen(true);
                }}
              />
              <Popconfirm
                title={`Xóa ${entityName}`}
                description={`Bạn có chắc chắn muốn xóa ${entityName} này không?`}
                onConfirm={() => actions.deleteMutation.mutate(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true, className: 'rounded-xl font-bold' }}
                cancelButtonProps={{ className: 'rounded-xl' }}
              >
                <Button
                  type="text" danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  loading={actions.deleteMutation.isPending && (actions.deleteMutation.variables as any) === record.id}
                />
              </Popconfirm>
            </>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<UndoOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                actions.restoreMutation.mutate(record.id);
              }}
              loading={actions.restoreMutation.isPending && (actions.restoreMutation.variables as any) === record.id}
              className="bg-green-500 hover:bg-green-600 border-none rounded-lg font-bold text-[10px] uppercase flex items-center"
            >
              Khôi phục
            </Button>
          )}
        </Space>
      );
    }
  };

  return (
    <div className="space-y-6">
      <ManagementHeader
        title={title}
        description={description}
        addButtonText={addButtonText}
        onAdd={() => {
          state.setEditingRecord(null);
          state.setIsModalOpen(true);
        }}
        isLoading={actions.createMutation.isPending}
      />

      {(extraFilters?.showDeletedFilter || extraTabs?.length) && (
        <div className="border-b border-gray-100 pb-1">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
            className="border-none mb-0"
            items={[
              ...(extraFilters?.showDeletedFilter ? [
                {
                  key: 'active',
                  label: (
                    <span className="flex items-center gap-1.5 sm:gap-2 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                      <CheckCircleOutlined className="text-emerald-500 text-xs sm:text-sm" />
                      <span className="hidden sm:inline">Đang </span>hoạt động
                      <Badge
                        count={activeCount}
                        showZero
                        color="#10b981"
                        className="ml-1 font-bold scale-90"
                      />
                    </span>
                  ),
                },
                {
                  key: 'deleted',
                  label: (
                    <span className="flex items-center gap-1.5 sm:gap-2 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                      <DeleteOutlined className="text-rose-500 text-xs sm:text-sm" />
                      <span className="hidden sm:inline">Không hoạt động / </span>Đã xóa
                      <Badge
                        count={deletedCount}
                        showZero
                        color="#f43f5e"
                        className="ml-1 font-bold scale-90"
                      />
                    </span>
                  ),
                },
              ] : []),
              ...(extraTabs?.map(tab => ({
                key: tab.key,
                label: (
                  <span className="flex items-center gap-1.5 sm:gap-2 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                    {tab.label}
                    {tab.badge !== undefined && (
                      <Badge
                        count={tab.badge}
                        showZero
                        color="#f59e0b"
                        className="ml-1 font-bold scale-90"
                      />
                    )}
                  </span>
                ),
              })) || []),
            ]}
          />
        </div>
      )}

      {/* Toolbar và Table chuẩn — ẩn khi đang xem extra tab */}
      {!extraTabs?.some(t => t.key === activeTab) && (
        <ManagementToolbar
          searchText={state.searchText}
          setSearchText={state.setSearchText}
          includeDeleted={state.includeDeleted}
          setIncludeDeleted={state.setIncludeDeleted}
          searchPlaceholder={searchPlaceholder}
          extraFilters={extraFilters}
          filterStates={{
            selectedCategory: state.selectedCategory,
            setSelectedCategory: state.setSelectedCategory,
            availability: state.availability,
            setAvailability: state.setAvailability,
            featured: state.featured,
            setFeatured: state.setFeatured,
            sortBy: state.sortBy,
            setSortBy: state.setSortBy,
            sortDirection: state.sortDirection,
            setSortDirection: state.setSortDirection
          }}
        />
      )}

      {extraTabs?.some(t => t.key === activeTab) ? (
        // Render nội dung của extra tab đang active
        <>{extraTabs.find(t => t.key === activeTab)?.content}</>
      ) : (
        <Card variant="borderless" className="rounded-[20px] sm:rounded-[32px] shadow-sm border border-gray-100 p-1 sm:p-2 overflow-hidden" styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
          <Table
            columns={[...columns, actionColumn]}
            dataSource={displayRecords}
            rowKey="id"
            loading={data.isLoading}
            pagination={{
              current: state.currentPage,
              pageSize: activeTab === 'deleted' ? 20 : state.pageSize,
              total: extraFilters?.showDeletedFilter && activeTab === 'deleted' ? displayRecords.length : data.totalElements,
              showSizeChanger: true,
              className: 'custom-pagination',
              onChange: (page, size) => {
                state.setCurrentPage(page);
                if (activeTab !== 'deleted') {
                  state.setPageSize(size);
                }
              }
            }}
            className="custom-admin-table cursor-pointer"
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => handleView(record as T),
            })}
          />
        </Card>
      )}

      <ModalComponent
        isOpen={state.isModalOpen}
        editingRecord={state.editingRecord}
        isLoading={actions.createMutation.isPending || actions.updateMutation.isPending}
        onClose={() => state.setIsModalOpen(false)}
        onSave={handleSave}
        {...modalExtraProps}
      />

      <Modal
        title={<span className="text-xl font-black uppercase text-gray-800">Chi tiết {entityName}</span>}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" type="primary" className="bg-gray-800 rounded-xl font-bold" onClick={() => setIsViewModalOpen(false)}>
            Đóng
          </Button>
        ]}
        centered
        width={800}
      >
        {viewingRecord && (
          <div className="px-6 py-4">
            {renderDetail ? renderDetail(viewingRecord) : (
              <Descriptions column={1} bordered size="small" className="bg-gray-50 rounded-xl overflow-hidden">
                {Object.entries(viewingRecord).map(([key, value]) => (
                  <Descriptions.Item key={key} label={<span className="font-bold">{key}</span>}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};