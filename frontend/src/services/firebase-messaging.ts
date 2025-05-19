import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authRequest } from './api-client';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export async function requestUserPermission(): Promise<boolean> {
  // Xin quyền POST_NOTIFICATIONS cho Android 13+
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Thông báo', 'Bạn cần cấp quyền thông báo để nhận notification!');

      return false;
    }
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    getFCMToken();
    return true;
  }
  return false;
}

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return null;

    const token = await messaging().getToken();
    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export async function updateFCMToken(token: string) {
  console.log('FCM token gửi đi:', token);
  try {
    await authRequest('/auth/update-fcm-token', 'POST', { fcmToken: token });
  } catch (error) {
    console.log('Error updating FCM token:', error);
  }
}

export function setupFCMListeners() {
  // Khi app đang mở
  messaging().onMessage(async remoteMessage => {
    console.log('Received foreground message:', remoteMessage);
    // Hiển thị thông báo khi app đang mở
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || 'Thông báo',
        remoteMessage.notification.body || 'Bạn có thông báo mới'
      );
    }
  });

  // Khi app đang chạy nền
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Received background message:', remoteMessage);
    // Thông báo sẽ tự động hiển thị khi app ở background
  });

  // Khi click vào thông báo để mở app
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('App opened from background:', remoteMessage);
    // Xử lý khi user click vào thông báo để mở app
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || 'Thông báo',
        remoteMessage.notification.body || 'Bạn có thông báo mới'
      );
    }
  });

  // Kiểm tra xem app có được mở từ thông báo không
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from quit state:', remoteMessage);
        // Xử lý khi app được mở từ thông báo
        if (remoteMessage.notification) {
          Alert.alert(
            remoteMessage.notification.title || 'Thông báo',
            remoteMessage.notification.body || 'Bạn có thông báo mới'
          );
        }
      }
    });
} 