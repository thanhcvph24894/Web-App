import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Comment } from '../services/comment-service';

interface CommentListProps {
  comments: Comment[];
  loading?: boolean;
  onEndReached?: () => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  loading,
  onEndReached,
}) => {
  console.log('CommentList nhận comments:', comments);

  const renderComment = ({ item }: { item: Comment }) => {
    if (!item || !item.user) {
      console.log('Comment không hợp lệ:', item);
      return null;
    }

    console.log('Render comment item:', item);
    return (
      <View style={styles.commentContainer}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image
            source={
              item.user.avatar
                ? { uri: item.user.avatar }
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.name || 'Người dùng'}</Text>
            <View style={styles.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.round(Number(item.rating)) ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>

        {/* Content */}
        <Text style={styles.content}>{item.content}</Text>
      </View>
    );
  };

  if (!Array.isArray(comments)) {
    console.log('Comments không phải là mảng:', comments);
    return null;
  }

  return (
    <FlatList
      data={comments}
      renderItem={renderComment}
      keyExtractor={(item) => item._id || Math.random().toString()}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
      }
      ListFooterComponent={
        loading ? (
          <ActivityIndicator style={styles.loading} color="#000" />
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  loading: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  },
});

export default CommentList; 