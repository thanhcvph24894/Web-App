import { authRequest } from './api-client';

// Định nghĩa kiểu dữ liệu cho item trong đơn hàng
export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  price: number;
}

// Định nghĩa kiểu dữ liệu cho địa chỉ giao hàng
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note?: string;
}

// Định nghĩa kiểu dữ liệu cho đơn hàng
export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: ShippingAddress;
  paidAt?: string;
  deliveredAt?: string;
  shippingFee: number;
  discount: number;
  coupon?: string;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa kiểu dữ liệu cho response trả về danh sách đơn hàng
export interface OrdersResponse {
  orders: Order[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// Định nghĩa kiểu dữ liệu cho response trả về một đơn hàng
export interface OrderResponse {
  order: Order;
  paymentUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

// Định nghĩa kiểu dữ liệu cho request tạo đơn hàng
export interface CreateOrderData {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

// Tạo service cho đơn hàng
const orderService = {
  // Lấy tất cả đơn hàng
  getOrders: async (page: number = 1, limit: number = 10) => {
    return authRequest<OrdersResponse>(`orders?page=${page}&limit=${limit}`);
  },

  // Lấy chi tiết đơn hàng theo id
  getOrderById: async (orderId: string) => {
    return authRequest<OrderResponse>(`orders/${orderId}`);
  },

  // Tạo đơn hàng mới
  createOrder: async (orderData: CreateOrderData) => {
    console.log('Gửi yêu cầu tạo đơn hàng:', orderData);
    return authRequest<OrderResponse>('orders', 'POST', orderData);
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId: string) => {
    return authRequest<OrderResponse>(`orders/${orderId}/cancel`, 'PUT');
  },

  // Thanh toán đơn hàng
  payOrder: async (orderId: string, paymentDetails: any) => {
    return authRequest<OrderResponse>(
      `orders/${orderId}/pay`,
      'PUT',
      paymentDetails,
    );
  },
};

export default orderService; 