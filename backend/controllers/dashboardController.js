const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const moment = require('moment');

class DashboardController {
    async index(req, res, next) {
        try {
            // Đếm số lượng danh mục
            const categoryCount = await Category.countDocuments();
            
            // Đếm số lượng sản phẩm
            const productCount = await Product.countDocuments();
            
            // Đếm số lượng đơn hàng
            const orderCount = await Order.countDocuments();

            // Đếm số lượng người dùng
            const userCount = await User.countDocuments({ role: 'user' });
            
            // Kiểm tra có đơn hàng đã giao và đã thanh toán không
            const completedOrdersCount = await Order.countDocuments({ 
                orderStatus: 'Đã giao hàng',
                paymentStatus: 'Đã thanh toán'
            });
            
            console.log(`Đơn hàng đã giao và đã thanh toán: ${completedOrdersCount}`);
            
            // Check for completed orders in database
            const allOrders = await Order.find();
            console.log(`Tổng số đơn hàng trong DB: ${allOrders.length}`);
            console.log('Trạng thái các đơn hàng:');
            
            // Tạo bảng thống kê số lượng đơn hàng theo trạng thái
            const orderStatusSummary = {};
            const paymentStatusSummary = {};
            
            allOrders.forEach(order => {
                // Đếm theo trạng thái đơn hàng
                if (!orderStatusSummary[order.orderStatus]) {
                    orderStatusSummary[order.orderStatus] = 0;
                }
                orderStatusSummary[order.orderStatus]++;
                
                // Đếm theo trạng thái thanh toán
                if (!paymentStatusSummary[order.paymentStatus]) {
                    paymentStatusSummary[order.paymentStatus] = 0;
                }
                paymentStatusSummary[order.paymentStatus]++;
            });
            
            console.log('Thống kê theo trạng thái đơn hàng:', orderStatusSummary);
            console.log('Thống kê theo trạng thái thanh toán:', paymentStatusSummary);
            
            // Tính tổng doanh thu từ đơn hàng đã giao và đã thanh toán
            const totalRevenue = await Order.aggregate([
                {
                    $match: { 
                        orderStatus: 'Đã giao hàng',
                        paymentStatus: 'Đã thanh toán'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]).then(result => {
                console.log('Kết quả truy vấn tổng doanh thu:', JSON.stringify(result));
                return result[0]?.total || 0;
            });
            
            console.log(`Tổng doanh thu: ${totalRevenue}`);
            
            // Lấy đơn hàng mới nhất
            const recentOrders = await Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'name email');
                
            console.log(`Số đơn hàng mới nhất: ${recentOrders.length}`);
            
            // Log trạng thái của các đơn hàng mới nhất
            recentOrders.forEach((order, index) => {
                console.log(`Đơn hàng ${index}: orderStatus=${order.orderStatus}, paymentStatus=${order.paymentStatus}, totalAmount=${order.totalAmount}`);
            });

            // Lấy sản phẩm mới nhất
            const recentProducts = await Product.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('category', 'name');

            res.render('pages/dashboard', {
                title: 'Tổng quan',
                stats: {
                    categoryCount,
                    productCount,
                    orderCount,
                    userCount,
                    totalRevenue,
                    completedOrdersCount
                },
                recentOrders,
                recentProducts,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Lỗi dashboard:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải trang tổng quan');
            res.render('pages/dashboard', {
                title: 'Tổng quan',
                stats: {
                    categoryCount: 0,
                    productCount: 0,
                    orderCount: 0,
                    userCount: 0,
                    totalRevenue: 0,
                    completedOrdersCount: 0
                },
                recentOrders: [],
                recentProducts: [],
                messages: req.flash()
            });
        }
    }
}

module.exports = new DashboardController(); 