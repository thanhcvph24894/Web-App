import { authRequest } from './api-client';

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'system';
  read: boolean;
  data?: {
    orderId?: string;
    [key: string]: any;
  };
  createdAt: string;
}

interface NotificationApiResponse {
  notifications: Notification[];
}

interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: NotificationApiResponse;
}

interface BaseResponse {
  success: boolean;
  message?: string;
}

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    const response = await authRequest<NotificationResponse>('notifications');
    return response.data?.data?.notifications || [];
  }

  async markAsRead(notificationId: string): Promise<BaseResponse> {
    const response = await authRequest<BaseResponse>(`notifications/${notificationId}/read`, 'PUT');
    return response;
  }

  async markAllAsRead(): Promise<BaseResponse> {
    const response = await authRequest<BaseResponse>('notifications/read-all', 'PUT');
    return response;
  }

  async deleteNotification(notificationId: string): Promise<BaseResponse> {
    const response = await authRequest<BaseResponse>(`notifications/${notificationId}`, 'DELETE');
    return response;
  }
}

const notificationService = new NotificationService();
export default notificationService; 