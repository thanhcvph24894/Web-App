import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { Linking } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import {RootStackParamList, RootTabParamList} from '../types/navigation';

// Bọc các component vào React.memo để tránh lỗi rendering
const MemoizedLoginScreen = React.memo(LoginScreen);
const MemoizedRegisterScreen = React.memo(RegisterScreen);
const MemoizedHomeScreen = React.memo(HomeScreen);
const MemoizedCartScreen = React.memo(CartScreen);
const MemoizedProfileScreen = React.memo(ProfileScreen);
const MemoizedProductDetailScreen = React.memo(ProductDetailScreen);
const MemoizedCategoryProductsScreen = React.memo(CategoryProductsScreen);
const MemoizedCheckoutScreen = React.memo(CheckoutScreen);
const MemoizedEditProfileScreen = React.memo(EditProfileScreen);
const MemoizedOrderHistoryScreen = React.memo(OrderHistoryScreen);
const MemoizedChangePasswordScreen = React.memo(ChangePasswordScreen);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const MainTabs = () => {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url && url.startsWith('myapp://paypal-return')) {
        // Xử lý logic khi thanh toán thành công
        // Ví dụ: gọi API kiểm tra trạng thái đơn hàng, hiển thị thông báo thành công
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName = '';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}>
      <Tab.Screen
        name="HomeTab"
        component={MemoizedHomeScreen}
        options={{tabBarLabel: 'Trang chủ'}}
      />
      <Tab.Screen
        name="CartTab"
        component={MemoizedCartScreen}
        options={{tabBarLabel: 'Giỏ hàng'}}
      />
      <Tab.Screen
        name="ProfileTab"
        component={MemoizedProfileScreen}
        options={{tabBarLabel: 'Tài khoản'}}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#fff'},
        }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={MemoizedLoginScreen} />
        <Stack.Screen name="Register" component={MemoizedRegisterScreen} />
        <Stack.Screen name="ProductDetail" component={MemoizedProductDetailScreen} />
        <Stack.Screen
          name="CategoryProducts"
          component={MemoizedCategoryProductsScreen}
        />
        <Stack.Screen name="Cart" component={MemoizedCartScreen} />
        <Stack.Screen name="Checkout" component={MemoizedCheckoutScreen} />
        <Stack.Screen name="OrderHistory" component={MemoizedOrderHistoryScreen} />
        <Stack.Screen name="EditProfile" component={MemoizedEditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={MemoizedChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
