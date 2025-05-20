import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import authService from '../services/auth-service';
import cartService, { Cart } from '../services/cart-service';
import { formatCurrency } from '../utils';
import { CartItem, RootStackParamList, Product } from '../types/navigation';
import CustomHeader from '../components/CustomHeader';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Hàm ánh xạ từ item trong Cart sang CartItem
const mapCartItemToCartItem = (item: Cart['items'][0]): CartItem => {
  return {
    _id: item._id,
    product: {
      id: item.product._id,
      _id: item.product._id,
      name: item.product.name,
      slug: '', // Đặt giá trị mặc định
      description: '', // Đặt giá trị mặc định
      price: item.product.price,
      salePrice: item.product.salePrice,
      images: item.product.images,
      category: {
        id: '',
        _id: '',
        name: '',
        slug: ''
      },
      averageRating: 0,
      colors: [],
      sizes: []
    } as Product,
    variant: item.variant,
    quantity: item.quantity,
    price: item.price
  };
};

const CartScreen = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        fetchCart();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi kiểm tra đăng nhập:', error);
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      // Kiểm tra đăng nhập trước khi lấy giỏ hàng
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        setLoading(false);
        Alert.alert(
          'Thông báo',
          'Vui lòng đăng nhập để xem giỏ hàng',
          [
            {
              text: 'Đăng nhập',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return;
      }

      const response = await cartService.getCart();
      
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
        return;
      }
      
      if (response.success && response.data) {
        const cartData = response.data;
        setCart(cartData as unknown as Cart);
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      if (response && response.success && response.data) {
        setCart(response.data as unknown as Cart);
      }
    } catch (error) {
      console.error('Lỗi cập nhật số lượng:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng. Vui lòng thử lại sau.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      'Xóa sản phẩm',
      'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cartService.removeCartItem(itemId);
              if (response && response.success && response.data) {
                setCart(response.data as unknown as Cart);
              }
            } catch (error) {
              console.error('Lỗi xóa sản phẩm:', error);
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm. Vui lòng thử lại sau.');
            }
          },
        },
      ],
    );
  };

  const handleClearCart = () => {
    if (!cart || cart.items.length === 0) return;

    Alert.alert(
      'Xóa giỏ hàng',
      'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cartService.clearCart();
              if (response && response.success && response.data) {
                setCart(response.data as unknown as Cart);
              }
            } catch (error) {
              console.error('Lỗi xóa giỏ hàng:', error);
              Alert.alert('Lỗi', 'Không thể xóa giỏ hàng. Vui lòng thử lại sau.');
            }
          },
        },
      ],
    );
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    // @ts-ignore
    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    return (
      <View style={styles.cartItem}>
        <Image
          source={{
            uri: item.product.images && item.product.images.length > 0
              ? item.product.images[0]
              : 'https://via.placeholder.com/100',
          }}
          style={styles.productImage}
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          
          {item.variant && (Object.keys(item.variant).length > 0) && (
            <Text style={styles.variantText}>
              {item.variant.color ? `Màu: ${item.variant.color}` : ''}
              {item.variant.color && item.variant.size ? ' | ' : ''}
              {item.variant.size ? `Kích thước: ${item.variant.size}` : ''}
            </Text>
          )}
          
          <Text style={styles.productPrice}>
            {formatCurrency(item.price)}
          </Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                if (item.quantity > 1) {
                  handleUpdateQuantity(item._id, item.quantity - 1);
                }
              }}>
              <Icon name="remove" size={18} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}>
              <Icon name="add" size={18} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item._id)}>
          <Icon name="trash-outline" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Giỏ hàng" showBackButton={false} />
        <View style={styles.centerContainer}>
          <Icon name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Vui lòng đăng nhập để xem giỏ hàng</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Giỏ hàng" showBackButton={false} />
        <View style={styles.centerContainer}>
          <Icon name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}>
            <Text style={styles.shopButtonText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Giỏ hàng" showBackButton={false} />
      
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearButton}>Xóa tất cả</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart?.items.map(item => mapCartItemToCartItem(item))}
        renderItem={renderCartItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.itemList}
      />

      <View style={styles.summaryContainer}>
        <View style={styles.row}>
          <Text style={styles.summaryLabel}>Tổng sản phẩm:</Text>
          <Text style={styles.summaryValue}>{cart?.items.length}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.summaryLabel}>Tổng tiền:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(cart?.totalPrice || 0)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Tiến hành đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionBar: {
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clearButton: {
    color: '#ff3b30',
    fontSize: 14,
    padding: 5,
  },
  itemList: {
    paddingVertical: 10,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  variantText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 5,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  checkoutButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CartScreen; 