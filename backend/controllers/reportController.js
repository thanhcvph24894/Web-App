const Order = require('../models/Order');
const moment = require('moment');
moment.locale('vi');

class ReportController {
    async index(req, res) {
        try {
            if (!req.session.user || req.session.user.role !== 'admin') {
                req.flash('error', 'Bạn không có quyền truy cập trang này');
                return res.redirect('/dashboard');
            }

            const year = parseInt(req.query.year) || new Date().getFullYear();
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;

            const startOfMonth = moment(`${year}-${month}-01`).startOf('month').toDate();
            const endOfMonth = moment(`${year}-${month}-01`).endOf('month').toDate();
            const startOfYear = moment(`${year}-01-01`).startOf('year').toDate();
            const endOfYear = moment(`${year}-12-31`).endOf('year').toDate();

            const commonMatch = {
                orderStatus: 'Đã giao hàng',
                paymentStatus: 'Đã thanh toán'
            };

            const [
                completedOrdersInYear,
                monthlyRevenue,
                completedOrdersInMonth,
                monthlyDetailsResult,
                paymentMethodStats
            ] = await Promise.all([
                Order.countDocuments({
                    ...commonMatch,
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }),

                Order.aggregate([
                    { $match: { ...commonMatch, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
                    { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalAmount' } } },
                    { $sort: { _id: 1 } }
                ]),

                Order.countDocuments({
                    ...commonMatch,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }),

                Order.aggregate([
                    { $match: { ...commonMatch, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$totalAmount' },
                            orderCount: { $sum: 1 },
                            avgOrderValue: { $avg: '$totalAmount' }
                        }
                    }
                ]),

                Order.aggregate([
                    { $match: { ...commonMatch, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
                    {
                        $group: {
                            _id: '$paymentMethod',
                            count: { $sum: 1 },
                            total: { $sum: '$totalAmount' }
                        }
                    }
                ])
            ]);

            const monthlyDetails = monthlyDetailsResult[0] || {
                totalRevenue: 0,
                orderCount: 0,
                avgOrderValue: 0
            };

            const chartData = Array(12).fill(0);
            monthlyRevenue.forEach(item => {
                chartData[item._id - 1] = item.total;
            });

            res.render('pages/reports/index', {
                title: 'Báo cáo doanh thu',
                year,
                month,
                chartData,
                monthlyDetails,
                paymentMethodStats,
                moment,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Lỗi báo cáo:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải báo cáo');
            res.redirect('/dashboard');
        }
    }
}

module.exports = new ReportController();
