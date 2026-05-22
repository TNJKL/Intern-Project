import { useState, type ReactNode } from 'react';
import { Card, Table, Space, Button, Modal, Descriptions, Tabs, Badge } from 'antd';
import { EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useManagement } from './hooks/useManagement';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import { ManagementHeader } from './components/ManagementHeader';
import { ManagementToolbar } from './components/ManagementToolbar';
import { message } from '@/lib/antd';

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
}

export const BaseManagement = <T extends { id: string }>({
  title, description, entityName, addButtonText, searchPlaceholder,
  queryKey, service, columns, ModalComponent, extraFilters, modalExtraProps,
  renderDetail, formatSaveValues
}: BaseManagementProps<T>) => {
  
  const { state, data, actions } = useManagement<T>(queryKey, service);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<T | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

  const handleTabChange = (key: string) => {
    setActiveTab(key as 'active' | 'deleted');
    state.setIncludeDeleted(key === 'deleted');
    state.setCurrentPage(1);
    
    // Tăng pageSize khi ở tab Deleted để kéo được toàn bộ dữ liệu về lọc client-side đầy đủ
    if (key === 'deleted') {
      state.setPageSize(200);
    } else {
      state.setPageSize(20);
    }
  };

  const isDeletedRecord = (r: any) => {
    const isDeleted = !!(r.isDeleted || r.deleted || r.deletedAt || r.status === 'DELETED');
    const isNotAvailable = r.isAvailable === false;
    const isNotActive = r.isActive === false;
    return isDeleted || isNotAvailable || isNotActive;
  };

  const displayRecords = extraFilters?.showDeletedFilter
    ? (activeTab === 'deleted'
      ? data.records.filter(isDeletedRecord)
      : data.records.filter(r => !isDeletedRecord(r)))
    : data.records;

  // Query phụ để lấy số lượng đếm chính xác 100% cho cả 2 tab, đồng bộ với các bộ lọc tìm kiếm/danh mục hiện tại
  const { data: countData } = useReactQuery({
    queryKey: [
      queryKey, 
      'counts', 
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
  });

  const allRecordsForCount = Array.isArray(countData) ? countData : (countData?.data || []);
  
  // Thuật toán đồng bộ số liệu: Lấy số lượng hoạt động trực tiếp từ totalElements của server khi ở Tab 1 để khớp chính xác 100% với phân trang của bảng
  const activeCount = activeTab === 'active'
    ? data.totalElements
    : allRecordsForCount.filter(r => !isDeletedRecord(r)).length;

  const deletedCount = activeTab === 'active'
    ? Math.max(0, allRecordsForCount.length - data.totalElements)
    : allRecordsForCount.filter(isDeletedRecord).length;

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
      const isDeleted = (record as any).isDeleted || (record as any).deleted || (record as any).deletedAt || (record as any).status === 'DELETED';
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
          {!isDeleted ? (
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
              <Button 
                type="text" danger 
                icon={<DeleteOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  actions.deleteMutation.mutate(record.id);
                }}
                loading={actions.deleteMutation.isPending && (actions.deleteMutation.variables as any) === record.id}
              />
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

      {extraFilters?.showDeletedFilter && (
        <div className="border-b border-gray-100 pb-1">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
            className="border-none mb-0"
            items={[
              {
                key: 'active',
                label: (
                  <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                    <CheckCircleOutlined className="text-emerald-500 text-sm" />
                    Đang hoạt động
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
                  <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                    <DeleteOutlined className="text-rose-500 text-sm" />
                    Không hoạt động / Đã xóa
                    <Badge 
                      count={deletedCount} 
                      showZero 
                      color="#f43f5e" 
                      className="ml-1 font-bold scale-90"
                    />
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}

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

      <Card variant="borderless" className="rounded-[32px] shadow-sm border border-gray-100 p-2 overflow-hidden" styles={{ body: { padding: '24px' } }}>
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
