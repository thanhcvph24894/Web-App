import {
  request,
  authRequest,
  authRequestFormData,
  setToken,
  getToken,
} from './api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kiểu dữ liệu cho người dùng
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  token?: string;
}

// Kiểu dữ liệu trả về khi đăng nhập/đăng ký
export interface AuthData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  token: string;
}

// Kiểu dữ liệu đầu vào đăng nhập
interface LoginCredentials {
  email: string;
  password: string;
}

// Kiểu dữ liệu đầu vào đăng ký
interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// Kiểu dữ liệu cập nhật hồ sơ
interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
}

// Kiểu dữ liệu đổi mật khẩu
interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Kiểu AuthResponse
interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Tạo service cho xác thực
const authService = {
  // Kiểm tra đã đăng nhập
  async isAuthenticated(): Promise<boolean> {
    const token = getToken();
    return !!token;
  },

  // Đăng nhập
  async login(credentials: LoginCredentials) {
    try {
      // Gọi API đăng nhập - sửa endpoint từ auth/login thành auth/login
      const response = await request('auth/login', 'POST', credentials);
      
      // Nếu đăng nhập thành công, lưu token và thông tin user
      if (response.success && response.data) {
        const userData = response.data as AuthResponse;
        
        // Lưu token vào bộ nhớ
        await AsyncStorage.setItem('authToken', userData.token);
        setToken(userData.token);
        
        return {
          success: true,
          data: userData.user
        };
      }
      
      return response;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return {
        success: false,
        message: 'Lỗi kết nối đến máy chủ',
      };
    }
  },

  // Đăng ký
  async register(credentials: RegisterCredentials) {
    try {
      // Gọi API đăng ký - sửa endpoint từ auth/register thành auth/register
      const response = await request('auth/register', 'POST', credentials);
      
      // Nếu đăng ký thành công, lưu token và thông tin user
      if (response.success && response.data) {
        const userData = response.data as AuthResponse;
        
        // Lưu token vào bộ nhớ
        await AsyncStorage.setItem('authToken', userData.token);
        setToken(userData.token);
        
        return {
          success: true,
          data: userData.user
        };
      }
      
      return response;
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      return {
        success: false,
        message: 'Lỗi kết nối đến máy chủ',
      };
    }
  },

  // Lấy thông tin người dùng
  async getProfile() {
    return authRequest('auth/me');
  },

  // Cập nhật thông tin người dùng
  async updateProfile(data: UpdateProfileData) {
    return authRequest('auth/me', 'PUT', data);
  },

  // Đổi mật khẩu
  async changePassword(data: ChangePasswordData) {
    return authRequest('auth/change-password', 'PUT', data);
  },

  // Đăng xuất
  async logout() {
    try {
      // Xóa token khỏi bộ nhớ
      await AsyncStorage.removeItem('authToken');
      setToken('');
      
      return {
        success: true,
        message: 'Đăng xuất thành công'
      };
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      return {
        success: false,
        message: 'Lỗi khi đăng xuất'
      };
    }
  },

  // Khôi phục phiên đăng nhập từ AsyncStorage
  async restoreSession() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setToken(token);
        
        // Kiểm tra token còn hợp lệ không bằng cách lấy thông tin user
        const response = await this.getProfile();
        if (response.success && response.data) {
          return {
            success: true,
            data: response.data
          };
        } else {
          // Token không hợp lệ, đăng xuất
          return this.logout();
        }
      }
      return {
        success: false,
        message: 'Chưa đăng nhập'
      };
    } catch (error) {
      console.error('Lỗi khôi phục phiên đăng nhập:', error);
      return {
        success: false,
        message: 'Lỗi khôi phục phiên đăng nhập'
      };
    }
  },

  // Lấy thông tin người dùng
  async getUser() {
    try {
      const response = await this.getProfile();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      return null;
    }
  }
};

export default authService;
