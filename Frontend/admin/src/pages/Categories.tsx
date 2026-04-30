import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Modal, Form, Select, Upload, message } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

// Mock Data
const initialData = [
  {
    id: 'CAT01',
    name: 'Cà Phê Truyền Thống',
    description: 'Cà phê rang xay chuẩn vị Việt',
    productCount: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&h=400&fit=crop'
  },
  {
    id: 'CAT02',
    name: 'Trà Trái Cây',
    description: 'Thanh mát, giải nhiệt mùa hè',
    productCount: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
  },
  {
    id: 'CAT03',
    name: 'Cold Brew',
    description: 'Cà phê ủ lạnh thanh nhẹ',
    productCount: 5,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop'
  },
  {
    id: 'CAT04',
    name: 'Bánh Ngọt',
    description: 'Ăn kèm hoàn hảo với trà và cà phê',
    productCount: 15,
    status: 'inactive',
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=400&fit=crop'
  }
];

const Categories: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingCategory(record);
      form.setFieldsValue(record);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingCategory) {
        // Cập nhật
        setData(data.map(item => item.id === editingCategory.id ? { ...item, ...values } : item));
        message.success('Cập nhật danh mục thành công!');
      } else {
        // Thêm mới
        const newCategory = {
          ...values,
          id: `CAT0${data.length + 1}`,
          productCount: 0,
          image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop' // Ảnh mặc định
        };
        setData([...data, newCategory]);
        message.success('Thêm danh mục thành công!');
      }
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa danh mục này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setData(data.filter(item => item.id !== id));
        message.success('Đã xóa danh mục.');
      }
    });
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
      }
      return false; // Ngăn chặn upload thật
    },
  };

  const columns = [
    {
      title: 'HÌNH ẢNH',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (imgUrl: string) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
          <img src={imgUrl} alt="category" className="w-full h-full object-cover" />
        </div>
      )
    },
    {
      title: 'TÊN DANH MỤC',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <span className="font-bold text-gray-800 text-base">{text}</span>
          <p className="text-xs text-gray-500 mt-1">{record.description}</p>
        </div>
      )
    },
    {
      title: 'SẢN PHẨM',
      dataIndex: 'productCount',
      key: 'productCount',
      render: (count: number) => (
        <span className="font-bold text-gray-600">{count} món</span>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {status === 'active' ? 'HOẠT ĐỘNG' : 'ĐÃ ẨN'}
        </span>
      )
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-[#d37533]" />} 
            onClick={() => handleOpenModal(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Danh Mục Sản Phẩm</h2>
          <p className="text-gray-500 font-medium mt-1">Quản lý các nhóm đồ uống và món ăn của quán</p>
        </div>
        <Button 
          type="primary" 
          size="large"
          icon={<PlusOutlined />} 
          className="bg-gray-800 hover:bg-black rounded-xl font-bold px-6 shadow-md"
          onClick={() => handleOpenModal()}
        >
          Thêm danh mục mới
        </Button>
      </div>

      <Card className="rounded-[32px] shadow-sm border border-gray-100 p-2" bodyStyle={{ padding: '24px' }}>
        <div className="mb-6 flex gap-4 max-w-md">
          <Input 
            size="large" 
            placeholder="Tìm kiếm danh mục..." 
            prefix={<SearchOutlined className="text-gray-400" />} 
            className="rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-primary focus:bg-white transition-all"
          />
        </div>
        
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id"
          pagination={{ pageSize: 10, className: 'custom-pagination' }}
          className="custom-admin-table"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      {/* Modal Thêm/Sửa Danh mục */}
      <Modal
        title={<span className="text-xl font-black uppercase text-gray-800">{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</span>}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSave}
        okText="Lưu lại"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-[#d37533] rounded-lg font-bold shadow-md' }}
        cancelButtonProps={{ className: 'rounded-lg font-bold' }}
        centered
        width={500}
        styles={{ body: { borderRadius: '24px', padding: '24px' } }}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item 
            name="name" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Tên danh mục</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input size="large" placeholder="Ví dụ: Cà Phê Pha Máy" className="rounded-xl" />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Mô tả ngắn</span>}
          >
            <Input.TextArea rows={3} placeholder="Mô tả về danh mục này..." className="rounded-xl" />
          </Form.Item>

          <Form.Item 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Hình ảnh đại diện</span>}
          >
            <Upload {...uploadProps} listType="picture" maxCount={1}>
              <Button icon={<UploadOutlined />} className="rounded-lg">Chọn hình ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item 
            name="status" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Trạng thái</span>}
            initialValue="active"
          >
            <Select size="large" className="rounded-xl [&>.ant-select-selector]:!rounded-xl">
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Đã ẩn</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
