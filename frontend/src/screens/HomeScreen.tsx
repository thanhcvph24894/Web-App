import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  RootTabParamList,
  RootStackParamList,
  Category,
  Product,
} from '../types/navigation';
import {categoryService, productService} from '../services';
import {formatCurrency, convertImageUrl} from '../utils';
import CustomHeader from '../components/CustomHeader';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'HomeTab'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

interface ProductListData {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const HomeScreen = ({navigation}: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([fetchCategories(), fetchProducts()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await categoryService.getCategories();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setCategories(response.data as Category[]);
        } else if ('categories' in response.data) {
          setCategories(response.data.categories as Category[]);
        }
      } else {
        console.error('Lỗi lấy danh mục:', response.message);
      }
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productService.getProducts(1, 10);
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setProducts(response.data as Product[]);
        } else if ('products' in response.data) {
          setProducts(response.data.products as Product[]);
        }
      } else {
        console.error('Lỗi lấy sản phẩm:', response.message);
      }
    } catch (error) {
      console.error('Lỗi lấy sản phẩm:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCategoryPress = (category: Category, index: number) => {
    setSelectedCategoryIndex(index);
    navigation.navigate('CategoryProducts', {
      categorySlug: category.slug,
      categoryName: category.name,
    });
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', {productSlug: product.slug});
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(text.toLowerCase()) ||
        product.description.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) => {
    console.log(
      'DEBUG_IMAGE [Category]',
      JSON.stringify({
        original: item.image,
        converted: item.image ? convertImageUrl(item.image) : null,
        categoryName: item.name
      })
    );
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategoryIndex === index && styles.selectedCategory,
        ]}
        onPress={() => handleCategoryPress(item, index)}>
        {item.image ? (
          <Image source={{uri: convertImageUrl(item.image)}} style={styles.categoryImage} />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <Text style={styles.categoryImagePlaceholderText}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
        <Text style={styles.categoryName}>{item.name}</Text>
        {item.productCount && (
          <Text style={styles.productCount}>{item.productCount} sản phẩm</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({item}: {item: Product}) => {
    console.log(
      'DEBUG_IMAGE [Product]',
      JSON.stringify({
        original: item.images[0],
        converted: item.images[0] ? convertImageUrl(item.images[0]) : null,
        productName: item.name
      })
    );
    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => handleProductPress(item)}>
        <Image
          source={{uri: item.images[0] ? convertImageUrl(item.images[0]) : ''}}
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
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <CustomHeader title="Cửa hàng" showBackButton={false} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.categories}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        {loadingCategories ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={item => item._id}
            renderItem={renderCategoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        )}
      </View>

      <View style={styles.products}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? 'Kết quả tìm kiếm' : 'Sản phẩm mới'}
        </Text>
        {loadingProducts ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item._id}
            renderItem={renderProductItem}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={
              <Text style={styles.noResultsText}>
                Không tìm thấy sản phẩm phù hợp
              </Text>
            }
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categories: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    marginHorizontal: 4,
    alignItems: 'center',
    width: 80,
  },
  selectedCategory: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  categoryImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryImagePlaceholderText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  productCount: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  products: {
    flex: 1,
    paddingBottom: 16,
  },
  productList: {
    paddingHorizontal: 8,
  },
  productItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxWidth: '45%',
  },
  productImage: {
    width: '100%',
    height: 150,
    aspectRatio: 1,
  },
  productInfo: {
    padding: 8,
    height: 90,
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;
