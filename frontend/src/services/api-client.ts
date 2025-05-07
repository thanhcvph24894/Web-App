import axios from 'axios';

// URL API endpoint
const ROOT_HTTP = 'http://10.0.2.2:5001/api/v1/';
type RequestMethod = 'POST' | 'GET' | 'PUT' | 'DELETE';

let token = '';

// Thiết lập token
export const setToken = (newToken: string) => {
  token = newToken;
};

// Lấy token hiện tại
export const getToken = () => token;

// Kiểu dữ liệu chung cho response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  unauthorizedError?: boolean;
  serverError?: boolean;
  statusCode?: number;
  networkError?: boolean;
}

// Request không cần xác thực
export const request = <T = any>(
  url: string,
  method: RequestMethod = 'GET',
  data?: object,
  headers?: object,
): Promise<ApiResponse<T>> => {
  return axios({
    method,
    url,
    baseURL: ROOT_HTTP,
    data,
    timeout: 60000,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.data)
    .catch(error => {
      console.error('API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi kết nối đến máy chủ',
      };
    });
};

// Request cần xác thực
export const authRequest = <T = any>(
  url: string,
  method: RequestMethod = 'GET',
  data?: object | null,
  headers?: object | null,
  params?: object,
): Promise<ApiResponse<T>> => {
  // Kiểm tra token trước khi gọi API
  if (!token) {
    console.warn('Không có token để gọi API:', url);
    return Promise.resolve({
      success: false,
      message: 'Bạn cần đăng nhập để thực hiện chức năng này',
      unauthorizedError: true,
    });
  }

  console.log(`[authRequest] Gọi API ${method} ${url} với data:`, data);
  
  return axios({
    method,
    url,
    baseURL: ROOT_HTTP,
    data,
    params,
    timeout: 60000,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => {
      console.log(`[authRequest] Kết quả API ${url}:`, response.data);
      return response.data;
    })
    .catch(error => {
      console.error('API Auth Error:', error);
      
      if (error.response) {
        // Lỗi từ phía server (status codes khác 2xx)
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Xử lý lỗi 401 - Unauthorized
        if (error.response.status === 401) {
          return {
            success: false,
            message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại',
            unauthorizedError: true,
          };
        }
        
        // Xử lý lỗi 500 - Server Error
        if (error.response.status === 500) {
          console.error('Server error details:', error.response.data);
          return {
            success: false,
            message: error.response.data?.message || 'Lỗi máy chủ, vui lòng thử lại sau',
            serverError: true,
          };
        }
        
        return {
          success: false,
          message: error.response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
          statusCode: error.response.status,
        };
      } else if (error.request) {
        // Lỗi không nhận được response từ server
        console.error('Error request:', error.request);
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng',
          networkError: true,
        };
      } else {
        // Lỗi khi thiết lập request
        console.error('Error message:', error.message);
        return {
          success: false,
          message: 'Lỗi cấu hình yêu cầu: ' + error.message,
        };
      }
    });
};

// Request gửi form data có xác thực
export const authRequestFormData = <T = any>(
  url: string,
  method: RequestMethod = 'GET',
  data?: object,
  headers?: object,
  params?: object,
): Promise<ApiResponse<T>> => {
  // Kiểm tra token trước khi gọi API
  if (!token) {
    console.warn('Không có token để gọi API:', url);
    return Promise.resolve({
      success: false,
      message: 'Bạn cần đăng nhập để thực hiện chức năng này',
      unauthorizedError: true,
    });
  }
  
  return axios({
    method,
    url,
    baseURL: ROOT_HTTP,
    data,
    params,
    timeout: 60000,
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.data)
    .catch(error => {
      console.error('API Form Data Error:', error);
      
      // Xử lý lỗi 401 - Unauthorized
      if (error.response && error.response.status === 401) {
        return {
          success: false,
          message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại',
          unauthorizedError: true,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi kết nối đến máy chủ',
      };
    });
};

// Kiểm tra kết nối API
export const testConnection = async () => {
  try {
    const response = await axios.get(ROOT_HTTP);
    return response.status === 200;
  } catch (error) {
    console.error('Lỗi kết nối API:', error);
    return false;
  }
};

// Cấu hình interceptors
axios.interceptors.request.use(
  (config: any) => {
    if (__DEV__) {
      console.log('%c [API Request]', 'color: blue; font-weight: bold', {
        METHOD: config.method,
        HEADER: config.headers,
        DATA: config.data,
        URL: config.baseURL + config.url,
      });
    }
    return config;
  },
  error => {
    if (__DEV__) {
      console.log(
        '%c [API Request Error]',
        'color: red; font-weight: bold',
        error,
      );
    }
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  response => {
    if (__DEV__) {
      console.log('%c [API Response]', 'color: #248c1d; font-weight: bold', {
        METHOD: response.config.method,
        DATA: response.data,
        URL: response.config.url,
      });
    }
    return response;
  },
  error => {
    if (__DEV__) {
      console.log(
        '%c [API Response Error]',
        'color: red; font-weight: bold',
        error.response || error,
      );
    }
    return Promise.reject(error);
  },
);
