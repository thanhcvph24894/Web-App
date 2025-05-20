import {request} from './api-client';
import {ProductListResponse} from './product-service';

// Định nghĩa kiểu dữ liệu cho danh mục
export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

// Định nghĩa kiểu dữ liệu cho response
export interface CategoryResponse {
  success: boolean;
  data: Category[] | { categories: Category[] };
  message?: string;
}

export interface CategoryWithProductsResponse {
  success: boolean;
  data: {
    category: Category;
    products: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  };
  message?: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

// Tạo service cho danh mục
const categoryService = {
  // Lấy tất cả danh mục
  getCategories: () => {
    return request<CategoryResponse>('categories');
  },

  // Lấy các danh mục có sản phẩm
  getCategoriesWithProducts: () => {
    return request<CategoryResponse>('categories/with-products');
  },

  // Lấy chi tiết danh mục theo slug kèm sản phẩm
  getCategoryWithProducts: (slug: string, page: number = 1, limit: number = 10) => {
    return request<CategoryWithProductsResponse>(`categories/${slug}?page=${page}&limit=${limit}`);
  },
};

export default categoryService;
