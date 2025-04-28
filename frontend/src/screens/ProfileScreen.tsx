// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../types/navigation';
import { authService, logout, orderService } from '../services';
import CustomHeader from '../components/CustomHeader';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'ProfileTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  navigation: ProfileScreenNavigationProp;
};

const ProfileScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Thêm useFocusEffect để làm mới dữ liệu khi quay lại màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Kiểm tra xem có đăng nhập không
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        setUserInfo(null);
        setRecentOrders([]);
        setLoading(false);
        return;
      }
      
      // Lấy thông tin người dùng
      const user = await authService.getUser();
      if (user) {
        setUserInfo(user);
        
        // Chỉ lấy đơn hàng khi đã đăng nhập
        try {
          // Lấy các đơn hàng gần đây
          const response = await orderService.getOrders(1, 2); // Chỉ lấy 2 đơn hàng gần nhất
          
          // Kiểm tra lỗi unauthorized
          if (response.unauthorizedError) {
            // Xử lý lỗi phiên đăng nhập hết hạn
            await authService.logout();
            setUserInfo(null);
            setRecentOrders([]);
            Alert.alert(
              'Thông báo',
              response.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
            );
            return;
          }
          
          if (response.success && response.data) {
            // Kiểm tra nếu response.data là mảng
            if (Array.isArray(response.data)) {
              setRecentOrders(response.data as any[]);
            } 
            // Nếu không phải mảng, kiểm tra có thuộc tính orders không
            else if ('orders' in response.data) {
              setRecentOrders((response.data as any).orders);
            }
            // Trường hợp khác, gán mảng rỗng
            else {
              setRecentOrders([]);
            }
          }
        } catch (orderError) {
          console.error('Lỗi lấy thông tin đơn hàng:', orderError);
          setRecentOrders([]);
        }
      } else {
        setUserInfo(null);
        setRecentOrders([]);
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin:', error);
      setUserInfo(null);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            try {
              // Gọi API logout
              const result = await authService.logout();
              if (result.success) {
                // Chuyển đến màn hình đăng nhập
                navigation.navigate('Login');
              }
            } catch (error) {
              console.error('Lỗi đăng xuất:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Tài khoản" showBackButton={false} />
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>Bạn chưa đăng nhập</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Tài khoản" showBackButton={false} />

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <Image 
            source={{ 
              uri: userInfo.avatar || 'https://via.placeholder.com/100'
            }} 
            style={styles.avatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
            <Text style={styles.userPhone}>{userInfo.phone || 'Chưa cập nhật'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil" size={20} color="#007BFF" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản của tôi</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="person-outline" size={24} color="#000" />
            <Text style={styles.menuText}>Thông tin cá nhân</Text>
            <Icon name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="location-outline" size={24} color="#000" />
            <Text style={styles.menuText}>Địa chỉ giao hàng</Text>
            <Icon name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Icon name="key-outline" size={24} color="#000" />
            <Text style={styles.menuText}>Đổi mật khẩu</Text>
            <Icon name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('OrderHistory')}
            >
              <Text style={styles.viewAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <TouchableOpacity key={order._id} style={styles.orderItem}>
                <View>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text style={styles.orderTotal}>
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text
                    style={[
                      styles.orderStatus,
                      {
                        color: order.orderStatus === 'Đã giao hàng' ? '#4CAF50' :
                        order.orderStatus === 'Đã hủy' ? '#f44336' : '#FF9800',
                      },
                    ]}
                  >
                    {order.orderStatus}
                  </Text>
                  <Icon name="chevron-forward" size={24} color="#ccc" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noOrdersText}>Không có đơn hàng gần đây</Text>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={24} color="#ff4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: '#fff',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  section: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
  viewAll: {
    color: '#007BFF',
    fontSize: 14,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatus: {
    fontSize: 14,
    marginRight: 8,
  },
  noOrdersText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
  },
});

export default ProfileScreen;