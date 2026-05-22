import { apiClient } from '../lib/api';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  displayOrder: number;
  toppingIds?: string[];
  toppings?: any[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sizeLabel: string;
  price: number;
  isAvailable: boolean;
}

export interface Page<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const productService = {
  getAllProducts: async (params?: { 
    page?: number; 
    size?: number; 
    sort?: string; 
    sortBy?: string;
    sortDirection?: string;
    categoryId?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
    keyword?: string;
    includeDeleted?: boolean;
  }): Promise<Page<Product>> => {
    const { sortBy, sortDirection, ...rest } = params || {};
    const sort = sortBy ? `${sortBy},${sortDirection || 'asc'}` : params?.sort;
    
    const response = await apiClient.get('/products', { 
      params: { ...rest, sort } 
    });
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const [productRes, variantsRes] = await Promise.allSettled([
        apiClient.get(`/products/${id}`),
        apiClient.get(`/products/${id}/variants`)
      ]);
      
      const product = productRes.status === 'fulfilled' 
        ? (productRes.value.data.data || productRes.value.data)
        : null;
        
      const variants = variantsRes.status === 'fulfilled'
        ? (variantsRes.value.data.data || variantsRes.value.data || [])
        : [];
      
      if (!product) throw new Error('Product not found');

      return {
        ...product,
        variants: Array.isArray(variants) ? variants : []
      };
    } catch (error) {
      // Fallback nếu có lỗi nghiêm trọng
      const response = await apiClient.get(`/products/${id}`);
      return response.data.data || response.data;
    }
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const { variants, ...productData } = data;
    const response = await apiClient.post('/products', productData);
    const createdProduct = response.data.data || response.data;
    
    // Nếu có variants, gọi API tạo variants riêng
    if (variants && variants.length > 0) {
      await Promise.all(variants.map(v => 
        apiClient.post(`/products/${createdProduct.id}/variants`, v)
      ));
    }
    
    return createdProduct;
  },

  updateProduct: async (id: string, data: Partial<Product> & { deletedVariantIds?: string[] }): Promise<Product> => {
    const { variants, deletedVariantIds, ...productData } = data;
    const response = await apiClient.put(`/products/${id}`, productData);
    const updatedProduct = response.data.data || response.data;
    
    // 1. Xử lý xóa các variants TRƯỚC
    if (deletedVariantIds && deletedVariantIds.length > 0) {
      await Promise.all(deletedVariantIds.map(vId => 
        apiClient.delete(`/products/${id}/variants/${vId}`)
      ));
    }

    // 2. Xử lý thêm mới hoặc cập nhật variants SAU khi đã xóa xong
    if (variants && variants.length > 0) {
      await Promise.all(variants.map(v => {
        if (v.id && !v.id.toString().startsWith('temp-')) {
          return apiClient.put(`/products/${id}/variants/${v.id}`, v);
        } else {
          return apiClient.post(`/products/${id}/variants`, v);
        }
      }));
    }
    
    return updatedProduct;
  },

  deleteProduct: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // ─── Variants (Size/Giá) ───
  getVariants: async (productId: string): Promise<any[]> => {
    const response = await apiClient.get(`/products/${productId}/variants`);
    return response.data.data || response.data;
  },

  createVariant: async (productId: string, data: any): Promise<any> => {
    const response = await apiClient.post(`/products/${productId}/variants`, data);
    return response.data.data || response.data;
  },

  updateVariant: async (productId: string, variantId: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/products/${productId}/variants/${variantId}`, data);
    return response.data.data || response.data;
  },

  deleteVariant: async (productId: string, variantId: string): Promise<any> => {
    const response = await apiClient.delete(`/products/${productId}/variants/${variantId}`);
    return response.data;
  },

  restoreProduct: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/products/${id}/restore`);
    return response.data;
  }
};
