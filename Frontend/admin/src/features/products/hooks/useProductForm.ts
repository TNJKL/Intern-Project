import { useState, useEffect } from 'react';
import { Form } from 'antd';
import { message } from '@/lib/antd';
import { fileService } from '@/services/file.service';
import { toppingService, type Topping } from '@/services/topping.service';

export const useProductForm = (isOpen: boolean, editingRecord: any) => {
  const [form] = Form.useForm();
  const [isUploading, setIsUploading] = useState(false);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [isFetchingToppings, setIsFetchingToppings] = useState(false);
  const [isAddingTopping, setIsAddingTopping] = useState(false);
  
  // Quick Add Topping States
  const [newToppingName, setNewToppingName] = useState('');
  const [newToppingPrice, setNewToppingPrice] = useState<number>(0);

  const fetchToppings = async () => {
    setIsFetchingToppings(true);
    try {
      const data = await toppingService.getAllToppings();
      setToppings(data);
    } catch (error) {
      console.error('Failed to fetch toppings:', error);
    } finally {
      setIsFetchingToppings(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchToppings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          isAvailable: editingRecord.isAvailable ?? true,
          isFeatured: editingRecord.isFeatured ?? false,
          toppingIds: editingRecord.toppings ? editingRecord.toppings.map((t: any) => t.id) : (editingRecord.toppingIds || []),
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editingRecord, form]);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);
    try {
      const imageUrl = await fileService.uploadImage(file as File);
      form.setFieldsValue({ imageUrl });
      onSuccess("ok");
      message.success('Tải ảnh lên thành công!');
    } catch (error) {
      onError({ error });
      message.error('Tải ảnh lên thất bại!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAdditional = async (options: any, fieldName: number) => {
    const { file, onSuccess, onError } = options;
    try {
      const imageUrl = await fileService.uploadImage(file as File);
      const additionalImageUrls = form.getFieldValue('additionalImageUrls') || [];
      const updated = [...additionalImageUrls];
      updated[fieldName] = imageUrl;
      form.setFieldsValue({ additionalImageUrls: updated });
      onSuccess("ok");
      message.success('Tải ảnh phụ lên thành công!');
    } catch (error) {
      onError({ error });
      message.error('Tải ảnh phụ lên thất bại!');
    }
  };

  const handleQuickAddTopping = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newToppingName || newToppingPrice < 0) {
      message.warning('Vui lòng nhập tên và giá hợp lệ!');
      return;
    }

    setIsAddingTopping(true);
    try {
      const created = await toppingService.createTopping({
        name: newToppingName,
        price: newToppingPrice,
        isAvailable: true
      });
      message.success(`Đã tạo topping: ${created.name}`);
      await fetchToppings();
      const currentToppingIds = form.getFieldValue('toppingIds') || [];
      form.setFieldsValue({ toppingIds: [...currentToppingIds, created.id] });
      setNewToppingName('');
      setNewToppingPrice(0);
    } catch (error) {
      message.error('Không thể tạo nhanh Topping!');
    } finally {
      setIsAddingTopping(false);
    }
  };

  return {
    form,
    isUploading,
    toppings,
    isFetchingToppings,
    isAddingTopping,
    newToppingName,
    setNewToppingName,
    newToppingPrice,
    setNewToppingPrice,
    handleUpload,
    handleUploadAdditional,
    handleQuickAddTopping
  };
};
