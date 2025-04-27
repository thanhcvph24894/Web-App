export type Product = {
    id?: string;
    _id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    salePrice?: number;
    images: string[];
    category: {
        id?: string;
        _id: string;
        name: string;
        slug: string;
    };
    averageRating: number;
    colors: string[];
    sizes: string[];
    stock?: number;
    sold?: number;
};

export type Category = {
    id?: string;
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    productCount?: number;
};

export type CartItem = {
    _id: string;
    product: Product;
    variant?: {
        color?: string;
        size?: string;
    };
    quantity: number;
    price: number;
};

export type RootTabParamList = {
    HomeTab: undefined;
    CartTab: undefined;
    ProfileTab: undefined;
};

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: { screen?: keyof RootTabParamList };
    ProductDetail: { productSlug: string };
    CategoryProducts: { categorySlug: string, categoryName: string };
    Cart: undefined;
    Checkout: undefined;
    EditProfile: undefined;
    OrderHistory: undefined;
    Profile: undefined;
    ChangePassword: undefined;
    Notifications: undefined;
    Orders: undefined;
}; 