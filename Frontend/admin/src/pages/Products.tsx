import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Modal, Form, Select, InputNumber, Upload, message } from 'antd';
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
    id: 'PRD01', 
    name: 'Phin Sữa Đá', 
    category: 'Cà phê truyền thống', 
    price: 29000, 
    stock: 50, 
    image: '/images/product-cappuccino-new.jpg' 
  },
  { 
    id: 'PRD02', 
    name: 'Trà Sen Vàng', 
    category: 'Trà trái cây', 
    price: 45000, 
    stock: 25, 
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop' 
  },
  { 
    id: 'PRD03', 
    name: 'Cold Brew', 
    category: 'Cà phê ủ lạnh', 
    price: 55000, 
    stock: 8, 
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop' 
  },
  { 
    id: 'PRD04', 
    name: 'Bánh Mì Que', 
    category: 'Bánh ngọt', 
    price: 15000, 
    stock: 120, 
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=400&fit=crop' 
  },
];

const categoriesMock = ['Cà phê truyền thống', 'Trà trái cây', 'Cà phê ủ lạnh', 'Bánh ngọt', 'Đồ uống đá xay'];

const Products: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingProduct(record);
      form.setFieldsValue(record);
    } else {
      setEditingProduct(null);
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
      if (editingProduct) {
        // Cập nhật
        setData(data.map(item => item.id === editingProduct.id ? { ...item, ...values } : item));
        message.success('Cập nhật sản phẩm thành công!');
      } else {
        // Thêm mới
        const newProduct = {
          ...values,
          id: `PRD0${data.length + 1}`,
          image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=400&fit=crop' // Ảnh mặc định
        };
        setData([...data, newProduct]);
        message.success('Thêm sản phẩm thành công!');
      }
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
      content: 'Thao tác này sẽ xóa sản phẩm khỏi hệ thống vĩnh viễn.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setData(data.filter(item => item.id !== id));
        message.success('Đã xóa sản phẩm.');
      }
    });
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isJpgOrPng) {
        message.error('Bạn chỉ có thể tải lên file JPG/PNG/WEBP!');
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
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
          <img src={imgUrl} alt="product" className="w-full h-full object-cover" />
        </div>
      )
    },
    {
      title: 'TÊN SẢN PHẨM',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <span className="font-bold text-gray-800 text-base">{text}</span>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">{record.id}</p>
        </div>
      )
    },
    {
      title: 'DANH MỤC',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          {category}
        </span>
      )
    },
    {
      title: 'GIÁ BÁN',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-black text-[#d37533]">{price.toLocaleString('vi-VN')}đ</span>
      )
    },
    {
      title: 'TỒN KHO',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => {
        const isLow = stock < 10;
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isLow ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
            {stock} SP
          </span>
        );
      },
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Kho Hàng Sản Phẩm</h2>
          <p className="text-gray-500 font-medium mt-1">Quản lý các món ăn, thức uống và cập nhật giá</p>
        </div>
        <Button 
          type="primary" 
          size="large"
          icon={<PlusOutlined />} 
          className="bg-gray-800 hover:bg-black rounded-xl font-bold px-6 shadow-md"
          onClick={() => handleOpenModal()}
        >
          Thêm sản phẩm mới
        </Button>
      </div>

      <Card className="rounded-[32px] shadow-sm border border-gray-100 p-2" bodyStyle={{ padding: '24px' }}>
        <div className="mb-6 flex gap-4 max-w-md">
          <Input 
            size="large" 
            placeholder="Tìm tên sản phẩm hoặc mã..." 
            prefix={<SearchOutlined className="text-gray-400" />} 
            className="rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-[#d37533] focus:bg-white transition-all"
          />
        </div>
        
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id"
          pagination={{ pageSize: 8, className: 'custom-pagination' }}
          className="custom-admin-table"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      {/* Modal Thêm/Sửa Sản phẩm */}
      <Modal
        title={<span className="text-xl font-black uppercase text-gray-800">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</span>}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSave}
        okText="Lưu sản phẩm"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-[#d37533] rounded-lg font-bold shadow-md' }}
        cancelButtonProps={{ className: 'rounded-lg font-bold' }}
        centered
        width={600}
        styles={{ body: { borderRadius: '24px', padding: '24px' } }}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item 
              name="name" 
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Tên sản phẩm</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
              className="sm:col-span-2"
            >
              <Input size="large" placeholder="Ví dụ: Cà Phê Sữa Đá" className="rounded-xl" />
            </Form.Item>
            
            <Form.Item 
              name="category" 
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Danh mục</span>}
              rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
            >
              <Select size="large" className="rounded-xl [&>.ant-select-selector]:!rounded-xl" placeholder="Chọn danh mục">
                {categoriesMock.map(cat => (
                  <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="price" 
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Giá bán (VNĐ)</span>}
              rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
            >
              <InputNumber 
                size="large" 
                className="w-full rounded-xl" 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: any) => value!.replace(/\$\s?|(,*)/g, '')}
                min={0}
                step={1000}
              />
            </Form.Item>

            <Form.Item 
              name="stock" 
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Tồn kho</span>}
              rules={[{ required: true, message: 'Nhập số lượng tồn!' }]}
            >
              <InputNumber size="large" className="w-full rounded-xl" min={0} />
            </Form.Item>

            <Form.Item 
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Hình ảnh</span>}
              className="sm:col-span-2"
            >
              <Upload {...uploadProps} listType="picture" maxCount={1}>
                <Button icon={<UploadOutlined />} className="rounded-lg">Tải ảnh lên</Button>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
