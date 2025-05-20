import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import notificationService, { Notification } from '../services/notification-service';
import CustomHeader from '../components/CustomHeader';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const NotificationsScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const notifications = await notificationService.getNotifications();
      setNotifications(notifications);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification._id);
      }

      // Xử lý điều hướng dựa trên loại thông báo
      if (notification.type === 'order' && notification.data?.orderId) {
        // Chuyển đến màn hình Orders
        navigation.navigate('Orders');
      } else if (notification.type === 'payment' && notification.data?.orderId) {
        // Chuyển đến màn hình Orders để xem trạng thái thanh toán
        navigation.navigate('Orders');
      } else if (notification.type === 'system') {
        // Thông báo hệ thống - chỉ đánh dấu đã đọc
        await notificationService.markAsRead(notification._id);
      }

      // Cập nhật lại danh sách thông báo sau khi xử lý
      fetchNotifications();
    } catch (error) {
      console.error('Lỗi khi xử lý thông báo:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc tất cả:', error);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}>
      <View style={styles.iconContainer}>
        <Icon
          name={
            item.type === 'order'
              ? 'cart'
              : item.type === 'payment'
              ? 'card'
              : 'notifications'
          }
          size={24}
          color={item.read ? '#666' : '#000'}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Thông báo" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Thông báo" />
      
      {notifications.length > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unreadItem: {
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#666',
  },
  unreadText: {
    color: '#000',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  markAllButton: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  markAllText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default NotificationsScreen; 