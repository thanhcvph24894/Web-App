import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CartItem, Product } from '../../types';
import cartService from '../../services/cartService';
import authService from '../../services/authService';
import styles from './CartScreenStyle';

const CartScreen = ({ navigation }: any) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mapCartItemToCartItem = (item: any): CartItem => ({
    id: item.id,
    product: item.product as Product,
    quantity: item.quantity,
  });

  const fetchCart = async (requireAuthCheck = true) => {
    setLoading(true);
    try {
      if (requireAuthCheck) {
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          setLoading(false);
          Alert.alert(
            'Thông báo',
            'Vui lòng đăng nhập để xem giỏ hàng',
            [{ text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }
      }

      const response = await cartService.getCart();
      const mappedItems = response.map(mapCartItemToCartItem);
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        await fetchCart(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi kiểm tra đăng nhập:', error);
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (!cartItems || cartItems.length === 0) return;

    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              await cartService.clearCart();
              setCartItems([]);
            } catch (error) {
              console.error('Lỗi khi xóa giỏ hàng:', error);
              Alert.alert('Lỗi', 'Không thể xóa giỏ hàng');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  useFocusEffect(useCallback(checkAuth, []));

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.product.images?.[0] ?? 'https://via.placeholder.com/100' }}
        style={styles.productImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.productPrice}>Giá: ${item.product.price}</Text>
        <Text style={styles.productQuantity}>Số lượng: {item.quantity}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text>Giỏ hàng trống</Text>}
          />
          {cartItems.length > 0 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.button} onPress={handleClearCart}>
                <Text style={styles.buttonText}>Xóa tất cả</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.checkoutButton]}
                onPress={() => navigation.navigate('Checkout')}
              >
                <Text style={styles.buttonText}>Thanh toán</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={styles.authContainer}>
          <Text style={styles.authText}>Vui lòng đăng nhập để xem giỏ hàng</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CartScreen;
