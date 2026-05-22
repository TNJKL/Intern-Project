import { useState, type ReactNode } from 'react';
import { Card, Table, Space, Button, Modal, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined } from '@ant-design/icons';
import { useManagement } from './hooks/useManagement';
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
          dataSource={data.records}
          rowKey="id"
          loading={data.isLoading}
          pagination={{
            current: state.currentPage,
            pageSize: state.pageSize,
            total: data.totalElements,
            showSizeChanger: true,
            className: 'custom-pagination',
            onChange: (page, size) => {
              state.setCurrentPage(page);
              state.setPageSize(size);
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
                  <Descriptions.Item key={key} label={key} labelStyle={{ fontWeight: 'bold' }}>
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
