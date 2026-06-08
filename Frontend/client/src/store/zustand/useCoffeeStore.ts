import { create } from 'zustand';

export interface CoffeeType {
  id: string;
  name: string;
  title: string;
  image: string;
  price: string;
  description: string;
  rating: string;
}

export const COFFEE_DATA: Record<string, CoffeeType> = {
  espresso: {
    id: 'espresso',
    name: 'Espresso',
    title: 'ESPRESSO',
    image: '/images/cat-espresso.png',
    price: '35.000',
    description: 'Vị cà phê nguyên bản, đậm đặc và quyến rũ với lớp crema vàng óng.',
    rating: '4.9',
  },
  latte: {
    id: 'latte',
    name: 'Latte',
    title: 'LATTE',
    image: '/images/cat-latte.png',
    price: '45.000',
    description: 'Vị ngọt thanh của sữa hòa quyện cùng hương thơm đậm đà của hạt Arabica tuyển chọn.',
    rating: '4.9',
  },
  cappuccino: {
    id: 'cappuccino',
    name: 'Cappuccino',
    title: 'CAPPUCCINO',
    image: '/images/cat-cappuccino.png',
    price: '45.000',
    description: 'Sự cân bằng hoàn hảo giữa espresso, sữa nóng và bọt sữa mịn màng.',
    rating: '4.8',
  },
  matcha: {
    id: 'matcha',
    name: 'Matcha Latte',
    title: 'MATCHA',
    image: '/images/matcha.png',
    price: '50.000',
    description: 'Hương vị trà xanh Nhật Bản thanh khiết kết hợp cùng sữa tươi béo ngậy.',
    rating: '4.7',
  },
  coldbrew: {
    id: 'coldbrew',
    name: 'Cold Brew',
    title: 'COLD BREW',
    image: '/images/cold-brew.png',
    price: '55.000',
    description: 'Cà phê ủ lạnh trong 16 giờ, mang lại hương vị mượt mà, ít đắng và hậu vị ngọt.',
    rating: '4.9',
  },
  peach: {
    id: 'peach',
    name: 'Trà Đào',
    title: 'PEACH TEA',
    image: '/images/tea-peach.png',
    price: '40.000',
    description: 'Trà đen hảo hạng kết hợp với những miếng đào giòn ngọt và sả thơm nồng.',
    rating: '4.6',
  },
};

interface CoffeeStore {
  selectedId: string;
  selectedCoffee: CoffeeType;
  setSelectedCoffee: (id: string) => void;
  selectedMenuCategory: string;
  setSelectedMenuCategory: (id: string) => void;
}

export const useCoffeeStore = create<CoffeeStore>((set) => ({
  selectedId: 'latte',
  selectedCoffee: COFFEE_DATA['latte'],
  setSelectedCoffee: (id) => set({
    selectedId: id,
    selectedCoffee: COFFEE_DATA[id] || COFFEE_DATA['latte']
  }),
  selectedMenuCategory: 'all',
  setSelectedMenuCategory: (id) => set({ selectedMenuCategory: id }),
}));
