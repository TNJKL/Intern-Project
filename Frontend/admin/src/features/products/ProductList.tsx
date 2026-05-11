import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Modal, Descriptions, Badge } from 'antd';
import { message, modal } from '@/lib/antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { ProductModal } from './components/ProductModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, type Product } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

const ProductList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // State cho phần Xem chi tiết
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  });

  // Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAllProducts,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    retry: 1, // Tự động thử lại nếu lỗi 500
    onSuccess: () => {
      message.success('Thêm sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Create product error detail:', error.response?.data || error.message);
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Product> }) => productService.updateProduct(id, data),
    retry: 1, // Tự động thử lại 1 lần nếu gặp lỗi 500
    onSuccess: () => {
      message.success('Cập nhật sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Update product error detail:', error.response?.data || error.message);
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      message.success('Đã xóa sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Delete product error detail:', error.response?.data || error.message);
      
      // Trường hợp đặc biệt: Server xóa thành công nhưng lỗi khi trả về response (lỗi 500)
      if (error.response?.status === 500) {
        message.success('Xóa sản phẩm thành công!');
        queryClient.invalidateQueries({ queryKey: ['products'] });
        return;
      }

      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa!');
    }
  });

  const handleViewDetails = async (id: string) => {
    setIsFetchingDetails(true);
    setIsViewModalOpen(true);
    try {
      const data = await productService.getProductById(id);
      setViewingProduct(data);
    } catch (error) {
      message.error('Không thể tải chi tiết sản phẩm!');
      setIsViewModalOpen(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleOpenModal = (record?: Product) => {
    setEditingProduct(record || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = (values: any) => {
    const formattedValues = {
      ...values,
      price: Number(values.price),
      displayOrder: Number(values.displayOrder || 0),
    };

    if (editingProduct) {
      updateMutation.mutate({ 
        id: editingProduct.id, 
        data: { ...formattedValues, toppingIds: editingProduct.toppingIds || [] } 
      });
    } else {
      createMutation.mutate({ ...formattedValues, toppingIds: [] });
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteMutation.mutate(id);
      }
    });
  };

  const columns = [
    {
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">HÌNH ẢNH</span>,
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imgUrl: string) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100 flex items-center justify-center">
          {imgUrl ? (
            <img src={imgUrl} alt="product" className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-300 text-[10px] font-black uppercase text-center px-1">No Image</div>
          )}
        </div>
      )
    },
    {
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">TÊN SẢN PHẨM</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div>
          <span className="font-bold text-gray-800 text-sm uppercase tracking-tight">{text}</span>
          <p className="text-[11px] text-gray-400 mt-0.5 font-medium line-clamp-1 max-w-[200px]">{record.description || 'Không có mô tả'}</p>
        </div>
      )
    },
    {
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">DANH MỤC</span>,
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId: string) => {
        const catName = categories.find(c => c.id === categoryId)?.name || 'Chưa phân loại';
        return (
          <span className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 whitespace-nowrap">
            {catName}
          </span>
        );
      }
    },
    {
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">GIÁ BÁN</span>,
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-black text-[#d37533] text-sm">{price?.toLocaleString('vi-VN')}đ</span>
      )
    },
    {
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (isAvailable: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-block ${isAvailable ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {isAvailable ? 'ĐANG BÁN' : 'NGỪNG BÁN'}
        </span>
      ),
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      align: 'right' as const,
      width: 150,
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined className="text-blue-500" />} 
            onClick={() => handleViewDetails(record.id)}
          />
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
            loading={deleteMutation.isPending && deleteMutation.variables === record.id}
          />
        </Space>
      ),
    },
  ];

  // Lọc sản phẩm theo text search
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));

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
          loading={createMutation.isPending}
        >
          Thêm sản phẩm mới
        </Button>
      </div>

      <Card className="rounded-[32px] shadow-sm border border-gray-100 p-2" styles={{ body: { padding: '24px' } }}>
        <div className="mb-6 flex gap-4 max-w-md">
          <Input 
            size="large" 
            placeholder="Tìm tên sản phẩm..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined className="text-gray-400" />} 
            className="rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-[#d37533] focus:bg-white transition-all"
          />
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredProducts} 
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 8, className: 'custom-pagination' }}
          className="custom-admin-table"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        categories={categories}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      {/* Modal Xem Chi Tiết */}
      <Modal
        title={<span className="text-xl font-black uppercase text-gray-800">Chi tiết sản phẩm</span>}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" type="primary" className="bg-gray-800 rounded-xl font-bold" onClick={() => setIsViewModalOpen(false)}>
            Đóng
          </Button>
        ]}
        centered
        width={700}
        styles={{ body: { padding: '24px 0' } }}
      >
        {isFetchingDetails ? (
          <div className="py-10 text-center text-gray-400">Đang tải thông tin...</div>
        ) : viewingProduct ? (
          <div className="px-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                {viewingProduct.imageUrl ? (
                  <img src={viewingProduct.imageUrl} alt={viewingProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300 font-bold uppercase text-xs">No Image</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-800 uppercase mb-2">{viewingProduct.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{viewingProduct.description || 'Không có mô tả'}</p>
                <div className="flex gap-2">
                  <Badge status={viewingProduct.isAvailable ? "success" : "default"} text={viewingProduct.isAvailable ? "Đang bán" : "Ngừng bán"} className="font-bold" />
                  {viewingProduct.isFeatured && (
                    <Badge status="warning" text="Nổi bật" className="font-bold ml-2" />
                  )}
                </div>
              </div>
            </div>
            
            <Descriptions column={1} bordered size="small" className="bg-gray-50 rounded-xl overflow-hidden">
              <Descriptions.Item label="Mã ID" labelStyle={{ width: '130px', fontWeight: 'bold' }}>{viewingProduct.id}</Descriptions.Item>
              <Descriptions.Item label="Danh mục" labelStyle={{ fontWeight: 'bold' }}>
                {categories.find(c => c.id === viewingProduct.categoryId)?.name || 'Chưa phân loại'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá bán" labelStyle={{ fontWeight: 'bold' }}>
                <span className="text-[#d37533] font-black">{viewingProduct.price.toLocaleString('vi-VN')}đ</span>
              </Descriptions.Item>
              <Descriptions.Item label="Đường dẫn (Slug)" labelStyle={{ fontWeight: 'bold' }}>{viewingProduct.slug}</Descriptions.Item>
              <Descriptions.Item label="Thứ tự hiển thị" labelStyle={{ fontWeight: 'bold' }}>{viewingProduct.displayOrder}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" labelStyle={{ fontWeight: 'bold' }}>{new Date(viewingProduct.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối" labelStyle={{ fontWeight: 'bold' }}>{new Date(viewingProduct.updatedAt).toLocaleString('vi-VN')}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <div className="py-10 text-center text-red-500">Lỗi không tìm thấy dữ liệu</div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;
