import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CartItem } from '../types/navigation';
import cartService, { Cart } from '../services/cart-service';
import authService from '../services/auth-service';
import orderService from '../services/order-service';
import { formatCurrency } from '../utils';
import CustomHeader from '../components/CustomHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

type ShippingInfo = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note: string;
};

const CheckoutScreen = ({ navigation }: Props) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [placing, setPlacing] = useState<boolean>(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'banking'>('cod');

  useEffect(() => {
    fetchCart();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userInfo = await authService.getUser();
      if (userInfo) {
        // Cập nhật thông tin giao hàng từ dữ liệu người dùng
        setShippingInfo(prev => ({
          ...prev,
          fullName: userInfo.name || prev.fullName,
          phone: userInfo.phone || prev.phone,
          address: userInfo.address || prev.address
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
    }
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      
      // Xử lý lỗi 401 - Unauthorized
      if (response.unauthorizedError) {
        Alert.alert(
          'Thông báo',
          'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
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
      
      if (response.success && response.data) {
        setCart(response.data);
      } else {
        Alert.alert('Lỗi', 'Không thể tải giỏ hàng');
      }
    } catch (error) {
      console.error('Lỗi lấy giỏ hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải giỏ hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return 0;
    }
    
    return cart.items.reduce((total: number, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const shippingFee = 30000; // Phí ship cố định
  const total = calculateSubtotal() + shippingFee;

  const handlePlaceOrder = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống, không thể đặt hàng');
      return;
    }

    // Kiểm tra thông tin giao hàng
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin giao hàng');
      return;
    }
    
    // Bắt đầu quá trình đặt hàng
    setPlacing(true);
    
    try {
      // Đảm bảo giá trị paymentMethod là một trong các giá trị hợp lệ: 'COD', 'VNPAY', 'MOMO'
      const paymentMethod = selectedPayment === 'cod' ? 'COD' : 'VNPAY';
      
      const orderData = {
        shippingAddress: {
          fullName: shippingInfo.fullName,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city || '',
          district: shippingInfo.district || '',
          ward: shippingInfo.ward || '',
          note: shippingInfo.note || ''
        },
        paymentMethod: paymentMethod
      };

      console.log('Gửi đơn hàng với dữ liệu:', JSON.stringify(orderData));
      const response = await orderService.createOrder(orderData);
      console.log('Kết quả tạo đơn hàng:', JSON.stringify(response));
      
      if (response.unauthorizedError) {
        Alert.alert(
          'Thông báo',
          'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
          [
            {
              text: 'Đăng nhập',
              onPress: () => {
                authService.logout();
                navigation.navigate('Login');
              }
            }
          ]
        );
        return;
      }
      
      if (response.success) {
        // Xóa thông tin giỏ hàng khỏi state
        setCart(null);
        
        Alert.alert(
          'Thành công',
          'Đặt hàng thành công. Cảm ơn bạn đã mua hàng!',
          [
            {
              text: 'Xem đơn hàng',
              onPress: () => navigation.navigate('OrderHistory')
            },
            {
              text: 'Trang chủ',
              onPress: () => navigation.navigate('Main', { screen: 'HomeTab' })
            }
          ]
        );
      } else {
        const errorMessage = response.message || 'Có lỗi xảy ra khi đặt hàng';
        console.error('Lỗi đặt hàng chi tiết:', errorMessage);
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Lỗi đặt hàng:', error);
      let errorMessage = 'Không thể đặt hàng. Vui lòng thử lại sau.';
      
      // Kiểm tra loại lỗi để hiển thị thông báo phù hợp
      if (error instanceof Error) {
        console.error('Chi tiết lỗi:', error.message);
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setPlacing(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    field: keyof ShippingInfo,
    placeholder: string,
    multiline: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={(text) =>
          setShippingInfo((prev) => ({ ...prev, [field]: text }))
        }
        placeholder={placeholder}
        multiline={multiline}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Thanh toán" />

      <ScrollView style={styles.content}>
        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          {renderInput(
            'Họ và tên',
            shippingInfo.fullName,
            'fullName',
            'Nhập họ và tên người nhận'
          )}
          {renderInput(
            'Số điện thoại',
            shippingInfo.phone,
            'phone',
            'Nhập số điện thoại'
          )}
          {renderInput(
            'Địa chỉ',
            shippingInfo.address,
            'address',
            'Nhập địa chỉ giao hàng'
          )}
          {renderInput('Thành phố', shippingInfo.city, 'city', 'Nhập thành phố')}
          {renderInput('Quận/Huyện', shippingInfo.district, 'district', 'Nhập quận/huyện')}
          {renderInput('Phường/Xã', shippingInfo.ward, 'ward', 'Nhập phường/xã')}
          {renderInput(
            'Ghi chú',
            shippingInfo.note,
            'note',
            'Ghi chú cho đơn hàng',
            true
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cod' && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPayment('cod')}
          >
            <Icon
              name={selectedPayment === 'cod' ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={selectedPayment === 'cod' ? '#000' : '#666'}
            />
            <Text style={styles.paymentText}>Thanh toán khi nhận hàng (COD)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'banking' && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPayment('banking')}
          >
            <Icon
              name={
                selectedPayment === 'banking'
                  ? 'radio-button-on'
                  : 'radio-button-off'
              }
              size={24}
              color={selectedPayment === 'banking' ? '#000' : '#666'}
            />
            <Text style={styles.paymentText}>Chuyển khoản ngân hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan đơn hàng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>
              {calculateSubtotal().toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>
              {shippingFee.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            !shippingInfo.fullName && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={!shippingInfo.fullName}
        >
          <Text style={styles.placeOrderText}>Đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPayment: {
    borderColor: '#000',
    backgroundColor: '#f8f8f8',
  },
  paymentText: {
    fontSize: 16,
    marginLeft: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  placeOrderButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen; 