import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Product } from '../types/navigation';
import { categoryService } from '../services';
import { formatCurrency } from '../utils';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '../components/CustomHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryProducts'>;

// Interface phù hợp với dữ liệu trả về từ API
interface CategoryProductsData {
  category: any;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}

const CategoryProductsScreen = ({ navigation, route }: Props) => {
  const { categorySlug, categoryName } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategoryProducts();
  }, [categorySlug, page]);

  const fetchCategoryProducts = async () => {
    if (refreshing) return;
    
    try {
      setLoading(true);
      const response = await categoryService.getCategoryWithProducts(categorySlug, page);
      
      if (response.success && response.data) {
        // Ép kiểu dữ liệu từ response
        const categoryData = response.data as unknown as CategoryProductsData;
        setProducts(categoryData.products);
        setTotalPages(categoryData.pagination.pages);
      }
    } catch (error) {
      console.error('Lỗi lấy sản phẩm theo danh mục:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchCategoryProducts();
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      setPage(page + 1);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productSlug: product.slug });
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleProductPress(item)}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>
            {formatCurrency(item.salePrice || item.price)}
          </Text>
          {item.salePrice && (
            <Text style={styles.originalPrice}>
              {formatCurrency(item.price)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={categoryName} />

      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id || item._id || item.slug}
          contentContainerStyle={styles.productList}
          numColumns={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="cart-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  productItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  originalPrice: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  footerLoader: {
    marginVertical: 16,
    alignItems: 'center',
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

export default CategoryProductsScreen; 