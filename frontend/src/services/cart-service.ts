import { authRequest } from './api-client';

// Định nghĩa kiểu dữ liệu cho biến thể sản phẩm
export interface CartVariant {
  color?: string;
  size?: string;
}

// Định nghĩa kiểu dữ liệu cho giỏ hàng
export interface Cart {
  _id: string;
  user: string;
  items: {
    _id: string;
    product: {
      _id: string;
      name: string;
      price: number;
      salePrice?: number;
      images: string[];
    };
    variant?: CartVariant;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa kiểu dữ liệu cho response trả về
export interface CartResponse {
  cart: Cart;
}

// Tạo service cho giỏ hàng
const cartService = {
  // Lấy giỏ hàng
  getCart: async () => {
    return authRequest<Cart>('cart');
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (productId: string, quantity: number = 1, variant?: CartVariant) => {
    const data = {
      productId,
      quantity,
      ...(variant && { variant })
    };
    return authRequest<Cart>('cart', 'POST', data);
  },

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  updateCartItem: async (itemId: string, quantity: number) => {
    return authRequest<Cart>(`cart/${itemId}`, 'PUT', { quantity });
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeCartItem: async (itemId: string) => {
    return authRequest<Cart>(`cart/${itemId}`, 'DELETE');
  },

  // Xóa tất cả sản phẩm khỏi giỏ hàng
  clearCart: async () => {
    return authRequest<Cart>('cart', 'DELETE');
  }
};

export default cartService; 