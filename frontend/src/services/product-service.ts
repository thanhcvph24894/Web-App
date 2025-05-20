import { request } from './api-client';

// Định nghĩa kiểu dữ liệu cho sản phẩm
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  averageRating: number;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  sold?: number;
}

// Định nghĩa kiểu dữ liệu cho response
export interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface ProductListResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  } | Product[];
  message?: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
}

// Tạo service cho sản phẩm
const productService = {
  // Lấy danh sách sản phẩm
  getProducts: (page: number = 1, limit: number = 10, category?: string) => {
    let url = 'products';
    const queryParams: string[] = [];

    if (page) {
      queryParams.push(`page=${page}`);
    }
    if (limit) {
      queryParams.push(`limit=${limit}`);
    }
    if (category) {
      queryParams.push(`category=${category}`);
    }

    if (queryParams.length > 0) {
      url = `${url}?${queryParams.join('&')}`;
    }

    return request<ProductListResponse>(url);
  },

  // Lấy chi tiết sản phẩm
  getProductDetail: (slug: string) => {
    return request<ProductResponse>(`products/${slug}`);
  },

  // Lấy sản phẩm nổi bật
  getFeaturedProducts: () => {
    return request<ProductListResponse>('products?featured=true');
  },

  // Tìm kiếm sản phẩm
  searchProducts: (keyword: string, page: number = 1, limit: number = 10) => {
    const url = `products/search?keyword=${keyword}&page=${page}&limit=${limit}`;
    return request<ProductListResponse>(url);
  },
};

export default productService;
