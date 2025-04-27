const Order = require('../models/Order');

// Helper functions
const getOrderStatusEnums = () => {
    try {
        return Order.schema.path('orderStatus')?.enumValues || [
            'Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'
        ];
    } catch (error) {
        console.error('Error fetching orderStatus enums:', error);
        return ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
    }
};

const getPaymentStatusEnums = () => {
    try {
        return Order.schema.path('paymentStatus')?.enumValues || [
            'Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền'
        ];
    } catch (error) {
        console.error('Error fetching paymentStatus enums:', error);
        return ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền'];
    }
};

class OrderController {
    // GET /orders
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

    // GET /orders/:id
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

    // PUT /orders/:id/status
    async updateStatus(req, res) {
        try {
            const { orderStatus } = req.body;
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
            }

            const validStatuses = getOrderStatusEnums();
            if (!validStatuses.includes(orderStatus)) {
                return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ' });
            }

            if (order.orderStatus === 'Đã hủy' || 
                (order.orderStatus === 'Đã giao hàng' && orderStatus !== 'Đã giao hàng')) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể thay đổi trạng thái đơn hàng đã hủy hoặc đã giao thành công'
                });
            }

            const validStatusFlow = {
                'Chờ xác nhận': ['Đã xác nhận', 'Đã hủy'],
                'Đã xác nhận': ['Đang giao hàng', 'Đã hủy'],
                'Đang giao hàng': ['Đã giao hàng', 'Đã hủy'],
                'Đã giao hàng': ['Đã giao hàng'],
                'Đã hủy': ['Đã hủy']
            };

            if (!validStatusFlow[order.orderStatus]?.includes(orderStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể chuyển trạng thái từ "${order.orderStatus}" sang "${orderStatus}"`
                });
            }

            order.orderStatus = orderStatus;

            // Xử lý tự động cập nhật paymentStatus nếu cần
            if (orderStatus === 'Đã giao hàng' && order.paymentMethod === 'COD' && order.paymentStatus === 'Chưa thanh toán') {
                order.paymentStatus = 'Đã thanh toán';
            } else if (orderStatus === 'Đã hủy' && order.paymentStatus === 'Đã thanh toán') {
                order.paymentStatus = 'Hoàn tiền';
            }

            await order.save();

            res.json({
                success: true,
                message: 'Cập nhật trạng thái đơn hàng thành công',
                paymentStatus: order.paymentStatus
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // PUT /orders/:id/payment
    async updatePaymentStatus(req, res) {
        try {
            const { paymentStatus } = req.body;
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
            }

            const validStatuses = getPaymentStatusEnums();
            if (!validStatuses.includes(paymentStatus)) {
                return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ' });
            }

            if (order.orderStatus === 'Đã hủy' && paymentStatus !== 'Hoàn tiền') {
                return res.status(400).json({ success: false, message: 'Đơn hàng đã hủy chỉ có thể chuyển sang trạng thái hoàn tiền' });
            }

            if (order.paymentMethod === 'COD' && order.orderStatus === 'Đã giao hàng' && paymentStatus === 'Chưa thanh toán') {
                return res.status(400).json({ success: false, message: 'Không thể chuyển đơn hàng COD đã giao về trạng thái chưa thanh toán' });
            }

            const validPaymentFlow = {
                'Chưa thanh toán': ['Đã thanh toán'],
                'Đã thanh toán': ['Hoàn tiền'],
                'Hoàn tiền': ['Hoàn tiền']
            };

            if (!validPaymentFlow[order.paymentStatus]?.includes(paymentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể chuyển trạng thái thanh toán từ "${order.paymentStatus}" sang "${paymentStatus}"`
                });
            }

            order.paymentStatus = paymentStatus;
            await order.save();

            res.json({ success: true, message: 'Cập nhật trạng thái thanh toán thành công' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // DELETE /orders/:id
    async delete(req, res) {
        try {
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
            }

            if (!['Chờ xác nhận', 'Đã hủy'].includes(order.orderStatus)) {
                return res.status(400).json({ success: false, message: 'Chỉ có thể xóa đơn hàng chưa xác nhận hoặc đã hủy' });
            }

            await order.deleteOne();

            res.json({ success: true, message: 'Xóa đơn hàng thành công' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new OrderController();
