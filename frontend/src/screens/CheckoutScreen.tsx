import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  BackHandler,
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

interface MomoPaymentResponse {
  paymentUrl: string;
  deeplink: string;
  qrCodeUrl: string;
}

const CheckoutScreen = ({ navigation, route }: Props) => {
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
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'momo'>('cod');
  const [orderId, setOrderId] = useState<string | null>(null);
  const momoPaymentHandled = useRef(false);

  useEffect(() => {
    // Listen for MoMo payment app return
    const handleDeepLink = (event) => {
      if (event.url && event.url.includes('momo-return')) {
        handleMomoReturn(event.url);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened from MoMo deeplink
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('momo-return')) {
        handleMomoReturn(url);
      }
    });

    fetchCart();
    fetchUserInfo();

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      subscription.remove();
      backHandler.remove();
    };
  }, []);

  // Check for payment result when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we need to verify payment status
      if (orderId && !momoPaymentHandled.current) {
        verifyPaymentStatus(orderId);
      }
    });

    return unsubscribe;
  }, [navigation, orderId]);

  const handleBackPress = () => {
    // If an order is in progress, confirm before going back
    if (placing) {
      Alert.alert(
        'Đơn hàng đang xử lý',
        'Bạn có chắc muốn hủy đặt hàng?',
        [
          { text: 'Ở lại', style: 'cancel', onPress: () => { } },
          { text: 'Hủy đặt hàng', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
      return true; // Prevent default behavior
    }
    return false; // Allow default back behavior
  };

  const handleMomoReturn = async (url) => {
    console.log('MOMO return URL:', url);
    try {
      if (momoPaymentHandled.current) return;

      // Parse URL parameters
      const urlObj = new URL(url);
      const resultCode = urlObj.searchParams.get('resultCode');
      const orderId = urlObj.searchParams.get('orderId');

      if (!orderId) return;

      momoPaymentHandled.current = true;

      if (resultCode === '0') {
        // Payment successful
        verifyPaymentStatus(orderId);
      } else {
        // Payment failed
        Alert.alert(
          'Thanh toán thất bại',
          'Thanh toán MoMo không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.',
          [
            {
              text: 'OK',
              onPress: () => setPlacing(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error handling MoMo return:', error);
      Alert.alert('Lỗi', 'Không thể xác thực trạng thái thanh toán.');
      setPlacing(false);
    } 
  };

  const verifyPaymentStatus = async (momoOrderId) => {
    try {
      setPlacing(true);
      console.log('Verifying payment status for order:', momoOrderId);

      // Call API to verify payment status
      const response = await orderService.verifyPayment(momoOrderId);

      if (response.success) {
        // Payment verified successfully
        setCart(null);
        Alert.alert(
          'Thành công',
          'Thanh toán thành công. Cảm ơn bạn đã mua hàng!',
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
        // Payment verification failed
        Alert.alert(
          'Thông báo',
          response.message || 'Không thể xác thực trạng thái thanh toán.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      Alert.alert('Lỗi', 'Không thể xác thực thanh toán. Vui lòng kiểm tra lại đơn hàng.');
    } finally {
      setPlacing(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const userInfo = await authService.getUser();
      if (userInfo) {
        // Update shipping info from user data
        setShippingInfo(prev => ({
          ...prev,
          fullName: userInfo.name || prev.fullName,
          phone: userInfo.phone || prev.phone,
          address: userInfo.address || prev.address
        }));
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();

      // Handle 401 Unauthorized
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
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
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

  const shippingFee = 30000; // Fixed shipping fee
  const total = calculateSubtotal() + shippingFee;

  const handlePlaceOrder = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống, không thể đặt hàng');
      return;
    }

    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin giao hàng');
      return;
    }

    setPlacing(true);

    try {
      const paymentMethod = selectedPayment === 'cod' ? 'COD' : 'MOMO';

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

      console.log('Sending order with data:', JSON.stringify(orderData));
      const response = await orderService.createOrder(orderData);
      console.log('Order creation result:', JSON.stringify(response));

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
        setCart(null);

        if (selectedPayment === 'momo' && response.data) {
          // Extract the MoMo order ID to verify payment later
          if (response.data.order && response.data.order._id) {
            setOrderId(response.data.order._id);
          } else if (response.data.momoPaymentInfo && response.data.momoPaymentInfo.orderId) {
            setOrderId(response.data.momoPaymentInfo.orderId);
          }

          let momoData;
          if ('paymentUrl' in response.data) {
            momoData = response.data;
          } else if (response.data.order && 'momoPaymentInfo' in response.data.order) {
            momoData = response.data.order.momoPaymentInfo;
          }

          if (momoData) {
            // On Android, offer option to open in MoMo app or via browser
            if (Platform.OS === 'android') {
              Alert.alert(
                'Thanh toán MoMo',
                'Vui lòng chọn cách thanh toán',
                [
                  {
                    text: 'Mở app MoMo',
                    onPress: async () => {
                      try {
                        if (momoData.deeplink) {
                          const supported = await Linking.canOpenURL(momoData.deeplink);
                          if (supported) {
                            await Linking.openURL(momoData.deeplink);
                          } else {
                            Alert.alert(
                              'Thông báo',
                              'Bạn chưa cài đặt ứng dụng MoMo. Vui lòng cài đặt hoặc chọn quét mã QR.',
                              [
                                {
                                  text: 'Cài đặt MoMo',
                                  onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.mservice.momotransfer'),
                                },
                                {
                                  text: 'Thanh toán qua trình duyệt',
                                  onPress: () => {
                                    if (momoData.paymentUrl) {e
                                      Linking.openURL(momoData.paymentUrl);
                                    }
                                  },
                                }
                              ]
                            );
                          }
                        }
                      } catch (error) {
                        console.error('Error opening MoMo app:', error);
                        Alert.alert('Lỗi', 'Không thể mở ứng dụng MoMo. Thử thanh toán qua trình duyệt.');
                        if (momoData.paymentUrl) {
                          Linking.openURL(momoData.paymentUrl);
                        }
                      }
                    }
                  },
                  {
                    text: 'Thanh toán qua trình duyệt',
                    onPress: () => {
                      if (momoData.paymentUrl) {
                        Linking.openURL(momoData.paymentUrl);
                      }
                    }
                  },
                  {
                    text: 'Hủy',
                    style: 'cancel',
                    onPress: () => setPlacing(false)
                  }
                ]
              );
            } else {
              // On iOS, directly open browser payment
              if (momoData.paymentUrl) {
                Linking.openURL(momoData.paymentUrl);
              }
            }
          } else {
            setPlacing(false);
            Alert.alert('Lỗi', 'Không thể lấy thông tin thanh toán MoMo');
          }
        } else if (selectedPayment === 'cod') {
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
          setPlacing(false);
        }
      } else {
        const errorMessage = response.message || 'Có lỗi xảy ra khi đặt hàng';
        console.error('Order error details:', errorMessage);
        Alert.alert('Lỗi', errorMessage);
        setPlacing(false);
      }
    } catch (error) {
      console.error('Order placement error:', error);
      let errorMessage = 'Không thể đặt hàng. Vui lòng thử lại sau.';

      if (error instanceof Error) {
        console.error('Error details:', error.message);
        errorMessage = `Lỗi: ${error.message}`;
      }

      Alert.alert('Lỗi', errorMessage);
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <>
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
                  selectedPayment === 'momo' && styles.selectedPayment,
                ]}
                onPress={() => setSelectedPayment('momo')}
              >
                <Icon
                  name={
                    selectedPayment === 'momo'
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={24}
                  color={selectedPayment === 'momo' ? '#000' : '#666'}
                />
                <Text style={styles.paymentText}>Thanh toán qua MoMo</Text>
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
                (placing || !shippingInfo.fullName) && styles.disabledButton,
              ]}
              onPress={handlePlaceOrder}
              disabled={placing || !shippingInfo.fullName}
            >
              {placing ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.placeOrderText}>Đang xử lý...</Text>
                </View>
              ) : (
                <Text style={styles.placeOrderText}>Đặt hàng</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CheckoutScreen;