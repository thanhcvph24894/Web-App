const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const moment = require('moment');

class DashboardController {
    async index(req, res, next) {
        try {
            // Thực hiện nhiều truy vấn song song để tối ưu tốc độ
            const [
                categoryCount,
                productCount,
                orderCount,
                userCount,
                completedOrdersCount,
                allOrders,
                recentOrders,
                recentProducts,
                revenueResult
            ] = await Promise.all([
                Category.countDocuments(),
                Product.countDocuments(),
                Order.countDocuments(),
                User.countDocuments({ role: 'user' }),
                Order.countDocuments({ 
                    orderStatus: 'Đã giao hàng',
                    paymentStatus: 'Đã thanh toán'
                }),
                Order.find(),
                Order.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('user', 'name email'),
                Product.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('category', 'name'),
                Order.aggregate([
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
                ])
            ]);

            // Thống kê số lượng đơn hàng theo trạng thái
            const orderStatusSummary = {};
            const paymentStatusSummary = {};

            allOrders.forEach(order => {
                orderStatusSummary[order.orderStatus] = (orderStatusSummary[order.orderStatus] || 0) + 1;
                paymentStatusSummary[order.paymentStatus] = (paymentStatusSummary[order.paymentStatus] || 0) + 1;
            });

            const totalRevenue = revenueResult[0]?.total || 0;

            res.render('pages/dashboard', {
                title: 'Tổng quan',
                stats: {
                    categoryCount,
                    productCount,
                    orderCount,
                    userCount,
                    totalRevenue,
                    completedOrdersCount,
                    orderStatusSummary,
                    paymentStatusSummary
                },
                recentOrders,
                recentProducts,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Lỗi khi tải Dashboard:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải trang tổng quan');
            res.render('pages/dashboard', {
                title: 'Tổng quan',
                stats: {
                    categoryCount: 0,
                    productCount: 0,
                    orderCount: 0,
                    userCount: 0,
                    totalRevenue: 0,
                    completedOrdersCount: 0,
                    orderStatusSummary: {},
                    paymentStatusSummary: {}
                },
                recentOrders: [],
                recentProducts: [],
                messages: req.flash()
            });
        }
    }
}

module.exports = new DashboardController();
