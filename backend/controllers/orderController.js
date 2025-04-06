const Order = require('../models/Order');

// Hàm helper để lấy danh sách enum từ schema
const getOrderStatusEnums = () => {
    try {
        return Order.schema.path('orderStatus').enumValues || ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
    } catch (error) {
        console.error('Lỗi khi lấy enum orderStatus:', error);
        return ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
    }
};

const getPaymentStatusEnums = () => {
    try {
        return Order.schema.path('paymentStatus').enumValues || ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền'];
    } catch (error) {
        console.error('Lỗi khi lấy enum paymentStatus:', error);
        return ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền'];
    }
};

class OrderController {
    // Hiển thị danh sách đơn hàng
    async index(req, res, next) {
        try {
            const orders = await Order.find()
                .populate('user', 'name email phone')
                .populate('items.product', 'name images')
                .sort({ createdAt: -1 });

            res.render('pages/orders/index', {
                title: 'Quản lý đơn hàng',
                orders,
                orderStatuses: getOrderStatusEnums(),
                paymentStatuses: getPaymentStatusEnums(),
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    // Hiển thị chi tiết đơn hàng
    async show(req, res, next) {
        try {
            const order = await Order.findById(req.params.id)
                .populate('user', 'name email phone address')
                .populate('items.product', 'name images price');

            if (!order) {
                req.flash('error', 'Không tìm thấy đơn hàng');
                return res.redirect('/orders');
            }

            res.render('pages/orders/show', {
                title: 'Chi tiết đơn hàng',
                order,
                orderStatuses: getOrderStatusEnums(),
                paymentStatuses: getPaymentStatusEnums(),
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    // Cập nhật trạng thái đơn hàng
    async updateStatus(req, res) {
        try {
            const { orderStatus } = req.body;
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }

            // Kiểm tra trạng thái hợp lệ
            const validStatuses = getOrderStatusEnums();
            if (!validStatuses.includes(orderStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái không hợp lệ'
                });
            }

            // Kiểm tra nếu đơn hàng đã hủy
            if (order.orderStatus === 'Đã hủy') {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể thay đổi trạng thái đơn hàng đã hủy'
                });
            }

            // Kiểm tra nếu đơn hàng đã giao thành công
            if (order.orderStatus === 'Đã giao hàng' && orderStatus !== 'Đã giao hàng') {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể thay đổi trạng thái đơn hàng đã giao thành công'
                });
            }

            // Kiểm tra thứ tự trạng thái hợp lệ
            const validStatusFlow = {
                'Chờ xác nhận': ['Đã xác nhận', 'Đã hủy'],
                'Đã xác nhận': ['Đang giao hàng', 'Đã hủy'],
                'Đang giao hàng': ['Đã giao hàng', 'Đã hủy'],
                'Đã giao hàng': ['Đã giao hàng'], // Không thể thay đổi
                'Đã hủy': ['Đã hủy'] // Không thể thay đổi
            };

            if (!validStatusFlow[order.orderStatus].includes(orderStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể chuyển trạng thái từ "${order.orderStatus}" sang "${orderStatus}"`
                });
            }

            // Cập nhật trạng thái
            order.orderStatus = orderStatus;
            await order.save();

            // Nếu đơn hàng đã giao hàng và chưa thanh toán, tự động cập nhật trạng thái thanh toán
            if (orderStatus === 'Đã giao hàng' && order.paymentMethod === 'COD' && order.paymentStatus === 'Chưa thanh toán') {
                order.paymentStatus = 'Đã thanh toán';
                await order.save();
            }

            // Nếu đơn hàng bị hủy và đã thanh toán, tự động chuyển sang trạng thái hoàn tiền
            if (orderStatus === 'Đã hủy' && order.paymentStatus === 'Đã thanh toán') {
                order.paymentStatus = 'Hoàn tiền';
                await order.save();
            }

            res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công',
                paymentStatus: order.paymentStatus
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Cập nhật trạng thái thanh toán
    async updatePaymentStatus(req, res) {
        try {
            const { paymentStatus } = req.body;
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }

            // Kiểm tra trạng thái hợp lệ
            const validStatuses = getPaymentStatusEnums();
            if (!validStatuses.includes(paymentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái thanh toán không hợp lệ'
                });
            }

            // Kiểm tra nếu đơn hàng đã hủy
            if (order.orderStatus === 'Đã hủy' && paymentStatus !== 'Hoàn tiền') {
                return res.status(400).json({
                    success: false,
                    message: 'Đơn hàng đã hủy chỉ có thể chuyển sang trạng thái hoàn tiền'
                });
            }

            // Nếu đơn hàng là COD và đã giao hàng, không cho phép chuyển về trạng thái chưa thanh toán
            if (order.paymentMethod === 'COD' && order.orderStatus === 'Đã giao hàng' && paymentStatus === 'Chưa thanh toán') {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể chuyển đơn hàng COD đã giao về trạng thái chưa thanh toán'
                });
            }

            // Kiểm tra thứ tự trạng thái thanh toán hợp lệ
            const validPaymentFlow = {
                'Chưa thanh toán': ['Đã thanh toán'],
                'Đã thanh toán': ['Hoàn tiền'],
                'Hoàn tiền': ['Hoàn tiền'] // Không thể thay đổi
            };

            if (!validPaymentFlow[order.paymentStatus].includes(paymentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể chuyển trạng thái thanh toán từ "${order.paymentStatus}" sang "${paymentStatus}"`
                });
            }

            // Cập nhật trạng thái thanh toán
            order.paymentStatus = paymentStatus;
            await order.save();

            res.json({
                success: true,
                message: 'Cập nhật trạng thái thanh toán thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Xóa đơn hàng
    async delete(req, res) {
        try {
            const order = await Order.findById(req.params.id);
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }

            // Chỉ cho phép xóa đơn hàng chưa xác nhận hoặc đã hủy
            if (!['Chờ xác nhận', 'Đã hủy'].includes(order.orderStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa đơn hàng đã được xử lý'
                });
            }

            await order.remove();

            res.json({
                success: true,
                message: 'Xóa đơn hàng thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new OrderController(); 