import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { orderService, authService } from '../services';
import CustomHeader from '../components/CustomHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderHistory'>;
};

type OrderItem = {
  product: {
    name: string;
    price: number;
    _id: string;
  };
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  orderNumber: string;
  items: any[];
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
};

const OrderHistoryScreen = ({ navigation }: Props) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Kiểm tra nếu đã đăng nhập
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
        Alert.alert(
          'Thông báo', 
          'Vui lòng đăng nhập để xem lịch sử đơn hàng',
          [
            {
              text: 'Đăng nhập',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        setLoading(false);
        return;
      }

      const response = await orderService.getOrders();
      
      // Kiểm tra lỗi unauthorized
      if (response.unauthorizedError) {
        // Xử lý lỗi phiên đăng nhập hết hạn
        Alert.alert(
          'Thông báo',
          response.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
          [
            {
              text: 'Đăng nhập',
              onPress: () => {
                // Đăng xuất trước khi chuyển đến màn hình đăng nhập
                authService.logout();
                navigation.navigate('Login');
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setOrders(response.data as Order[]);
        } else if ('orders' in response.data) {
          setOrders((response.data as any).orders as Order[]);
        } else {
          setOrders([]);
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tải lịch sử đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await orderService.cancelOrder(orderId);
      // Cập nhật lại trạng thái đơn hàng trong state
      const updatedOrders = orders.map(order =>
        order._id === orderId
        ? { ...order, orderStatus: 'Đã hủy' }
        : order
      );
      setOrders(updatedOrders);
      Alert.alert('Thành công', 'Đã hủy đơn hàng');
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'Đã giao hàng':
        return '#4CAF50';
      case 'Đã hủy':
        return '#f44336';
      default:
        return '#FF9800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Lịch sử đơn hàng" />

      <ScrollView style={styles.content}>
        {orders.length > 0 ? (
          orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderDate}>Ngày đặt: {formatDate(order.createdAt)}</Text>
                <Text
                  style={[
                    styles.orderStatus,
                    { color: getStatusColor(order.orderStatus) },
                  ]}
                >
                  {order.orderStatus}
                </Text>
              </View>

              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.totalText}>Tổng tiền:</Text>
                <Text style={styles.totalAmount}>{order.totalAmount.toLocaleString('vi-VN')}đ</Text>
              </View>

              {(order.orderStatus === 'Chờ xác nhận') && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelOrder(order._id)}
                  disabled={cancelingOrderId === order._id}
                >
                  {cancelingOrderId === order._id ? (
                    <ActivityIndicator size="small" color="#f44336" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalText: {
    fontSize: 15,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    height: 45,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderHistoryScreen; 