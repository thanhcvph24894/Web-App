import apiClient, { getToken } from './api-client';

export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product: string;
  order: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface CreateCommentData {
  orderId: string;
  productId: string;
  rating: number;
  content: string;
}

const commentService = {
  // Tạo comment mới
  createComment: async (data: CreateCommentData) => {
    const token = getToken();
    console.log('Token gửi lên:', token);
    console.log('Dữ liệu gửi lên API:', data);
    try {
      const res = await apiClient.post('/comments', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      console.log('Kết quả trả về:', res.data);
      return res;
    } catch (error: any) {
      if (error.response) {
        console.error('Lỗi 400 - Response data:', error.response.data);
      } else {
        console.error('Lỗi không xác định:', error);
      }
      throw error;
    }
  },

  // Lấy danh sách comment của sản phẩm (có token)
  getProductComments: async (productId: string, page: number = 1, limit: number = 10) => {
    const token = getToken();
    return apiClient.get(`/comments/product/${productId}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  },

  // Kiểm tra xem user đã comment sản phẩm trong đơn hàng chưa (có token)
  checkUserComment: async (orderId: string, productId: string) => {
    const token = getToken();
    return apiClient.get(`/comments/check/${orderId}/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  },
};

export default commentService; 