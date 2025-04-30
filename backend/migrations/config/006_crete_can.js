const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        variant: {
            size: String,
            color: String
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: String,
        district: String,
        ward: String
    },
    orderStatus: {
        type: String,
        enum: ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'],
        default: 'Chờ xác nhận'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'VNPAY', 'MOMO'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền'],
        default: 'Chưa thanh toán'
    },
    paidAt: Date,
    deliveredAt: Date,
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    note: String,
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    }
}, {
    timestamps: true
});

// Tự động tạo orderNumber nếu chưa có
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        this.orderNumber = 'DH' + Date.now() + Math.floor(1000 + Math.random() * 9000);
    }

    // Tương thích dữ liệu cũ: chuyển 'status' thành 'orderStatus' nếu có
    if (this.status && !this.orderStatus) {
        this.orderStatus = this.status;
    }

    next();
});

module.exports = mongoose.model('Order', orderSchema);
