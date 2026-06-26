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
  createdAt: string;
  updatedAt: string;
  toppingIds?: string[];
  toppings?: any[];
  variants?: ProductVariant[];
  additionalImageUrls?: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sizeLabel: string;
  price: number;
  isAvailable: boolean;
}
