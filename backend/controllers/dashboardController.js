const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const moment = require('moment');

class DashboardController {
    async index(req, res, next) {
        try {
            // Lấy số liệu tổng hợp song song
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
                Order.find().lean(),
                Order.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('user', 'name email')
                    .lean(),
                Product.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('category', 'name')
                    .lean(),
                this.getRevenue()
            ]);

            const { orderStatusSummary, paymentStatusSummary } = this.summarizeOrders(allOrders);
            const totalRevenue = revenueResult || 0;

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
                stats: this.emptyStats(),
                recentOrders: [],
                recentProducts: [],
                messages: req.flash()
            });
        }
    }

    async getRevenue() {
        const result = await Order.aggregate([
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
        ]);
        return result[0]?.total || 0;
    }

    summarizeOrders(orders) {
        const orderStatusSummary = {};
        const paymentStatusSummary = {};

        orders.forEach(order => {
            orderStatusSummary[order.orderStatus] = (orderStatusSummary[order.orderStatus] || 0) + 1;
            paymentStatusSummary[order.paymentStatus] = (paymentStatusSummary[order.paymentStatus] || 0) + 1;
        });

        return { orderStatusSummary, paymentStatusSummary };
    }

    emptyStats() {
        return {
            categoryCount: 0,
            productCount: 0,
            orderCount: 0,
            userCount: 0,
            totalRevenue: 0,
            completedOrdersCount: 0,
            orderStatusSummary: {},
            paymentStatusSummary: {}
        };
    }
}

module.exports = new DashboardController();
