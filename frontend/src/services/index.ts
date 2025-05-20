// Export các client API
export {setToken, getToken, testConnection} from './api-client';

// Thêm hàm logout để xóa token
export const logout = () => {
  // Import và gọi hàm setToken với chuỗi rỗng để xóa token
  const {setToken} = require('./api-client');
  setToken('');
};

// Export các services
export {default as authService} from './auth-service';
export {default as productService} from './product-service';
export {default as categoryService} from './category-service';
export {default as orderService} from './order-service';
export {default as cartService} from './cart-service';

// Export các kiểu dữ liệu
export type {AuthUser, AuthData} from './auth-service';
export type {
  CategoryResponse,
  CategoryWithProductsResponse,
} from './category-service';
export type {ProductResponse, ProductListResponse} from './product-service';
export type {CartVariant, Cart, CartResponse} from './cart-service';
export type {
  Order,
  OrderItem,
  ShippingAddress,
  OrdersResponse,
  OrderResponse,
  CreateOrderData,
} from './order-service';

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
