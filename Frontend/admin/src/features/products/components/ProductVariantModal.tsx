import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button } from 'antd';
import { CheckOutlined, DeleteOutlined, OrderedListOutlined } from '@ant-design/icons';
import { message } from '@/lib/antd';
import { productService, type Product } from '../../../services/product.service';
import { useQueryClient } from '@tanstack/react-query';

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductVariantModal: React.FC<ProductVariantModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && product) {
      form.setFieldsValue({
        variants: product.variants || []
      });
    }
  }, [isOpen, product, form]);

  const handleImmediateDelete = async (name: number, vId: string, remove: (index: number) => void) => {
    if (!vId || vId.toString().startsWith('temp-')) {
      remove(name);
      return;
    }
    
    try {
      await productService.deleteVariant(product.id, vId);
      message.success('Đã xóa kích thước thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      remove(name);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa kích thước');
    }
  };

  const handleImmediateSave = async (name: number) => {
    const variant = form.getFieldValue(['variants', name]);
    if (!variant.sizeLabel || variant.price === undefined) {
      message.error('Vui lòng nhập đầy đủ Size và Giá');
      return;
    }

    try {
      if (variant.id && !variant.id.toString().startsWith('temp-')) {
        await productService.updateVariant(product.id, variant.id, variant);
        message.success(`Đã cập nhật Size ${variant.sizeLabel}`);
      } else {
        const res = await productService.createVariant(product.id, variant);
        message.success(`Đã thêm Size ${variant.sizeLabel}`);
        // Cập nhật ID thật từ server trả về để tránh tạo trùng
        const newVariants = [...form.getFieldValue('variants')];
        newVariants[name] = res;
        form.setFieldsValue({ variants: newVariants });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Thao tác thất bại. Có thể trùng tên Size?');
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <OrderedListOutlined className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-gray-800 leading-none">Quản lý Kích thước</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sản phẩm: {product.name}</p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-xl font-bold px-8 h-11 border-gray-200">
          Đóng cửa sổ
        </Button>
      ]}
      centered
      width={600}
      forceRender
      styles={{ 
        mask: { backdropFilter: 'blur(4px)' },
        body: { padding: '24px 0' }
      }}
    >
      <Form form={form} layout="vertical" className="px-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <Form.List name="variants">
          {(fields, { add, remove }) => (
            <div className="space-y-4">
              {fields.map(({ key, name, ...restField }) => {
                const variantId = form.getFieldValue(['variants', name, 'id']);
                const isExisting = variantId && !variantId.toString().startsWith('temp-');
                
                return (
                  <div key={key} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-100 transition-all">
                    <Form.Item
                      {...restField}
                      name={[name, 'sizeLabel']}
                      rules={[{ required: true, message: 'Size?' }]}
                      className="mb-0 flex-[1]"
                    >
                      <Input placeholder="S, M, L..." className="rounded-xl border-gray-200 font-black text-center text-xs h-10" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      rules={[{ required: true, message: 'Giá?' }]}
                      className="mb-0 flex-[2]"
                    >
                      <InputNumber
                        className="w-full rounded-xl border-gray-200 font-bold text-xs h-10 flex items-center"
                        placeholder="Giá bán"
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value: any) => value!.replace(/\$\s?|(,*)/g, '')}
                        min={0}
                      />
                    </Form.Item>
                    
                    <div className="flex items-center gap-1.5 ml-2">
                      <Button 
                        type="primary"
                        icon={<CheckOutlined className="text-[11px]" />}
                        onClick={() => handleImmediateSave(name)}
                        className={`h-10 px-4 rounded-xl flex items-center gap-1.5 border-none shadow-sm transition-all hover:scale-105 active:scale-95 ${
                          isExisting 
                            ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200' 
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {isExisting ? 'Lưu' : 'Tạo'}
                        </span>
                      </Button>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined className="text-[11px]" />}
                        onClick={() => handleImmediateDelete(name, variantId, remove)}
                        className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-50 hover:bg-red-100 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
              
              <Button
                type="dashed"
                onClick={() => add({ id: `temp-${Date.now()}` })}
                block
                className="rounded-2xl border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-400 bg-amber-50/30 h-12 font-bold text-[11px] uppercase tracking-widest mt-4"
              >
                + Thêm kích thước mới
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

