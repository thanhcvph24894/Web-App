const mongoose = require('mongoose');
const Order = require('../models/Order');

const logError = (msg, err) => {
    console.error(`❌ ${msg}:`, err?.message || err);
};

// Hàm phụ để hiển thị đếm theo group
const displayGroupCounts = (title, items) => {
    console.log(`\n${title}`);
    items.forEach(item => {
        console.log(`  - ${item._id || 'Không xác định'}: ${item.count}`);
    });
};

async function analyzeOrders() {
    try {
        await mongoose.connect('mongodb://localhost:27017/shopquanao', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Đã kết nối MongoDB');

        const totalOrders = await Order.countDocuments();
        console.log(`\n📦 Tổng số đơn hàng: ${totalOrders}`);

        const nullOrderNumbers = await Order.countDocuments({
            $or: [{ orderNumber: null }, { orderNumber: { $exists: false } }],
        });
        console.log(`❓ Đơn hàng thiếu orderNumber: ${nullOrderNumbers}`);

        const orderStatusCounts = await Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        displayGroupCounts('📋 Số lượng đơn hàng theo trạng thái:', orderStatusCounts);

        const paymentMethodCounts = await Order.aggregate([
            { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        displayGroupCounts('💳 Số lượng theo phương thức thanh toán:', paymentMethodCounts);

        const paymentStatusCounts = await Order.aggregate([
            { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        displayGroupCounts('💰 Số lượng theo trạng thái thanh toán:', paymentStatusCounts);

        const latestOrder = await Order.findOne().sort({ createdAt: -1 });
        if (latestOrder) {
            console.log('\n🆕 Đơn hàng mới nhất:');
            console.log(`  ID: ${latestOrder._id}`);
            console.log(`  OrderNumber: ${latestOrder.orderNumber || 'Không có'}`);
            console.log(`  Ngày tạo: ${latestOrder.createdAt}`);
            console.log(`  Trạng thái: ${latestOrder.orderStatus || 'Không có'}`);
            console.log(`  Phương thức thanh toán: ${latestOrder.paymentMethod || 'Không có'}`);
            console.log(`  Trạng thái thanh toán: ${latestOrder.paymentStatus || 'Không có'}`);
        } else {
            console.log('\n⚠️ Không tìm thấy đơn hàng nào');
        }

        const problematicOrders = await Order.find({
            $or: [
                { orderNumber: null },
                { orderNumber: { $exists: false } },
                { orderStatus: null },
                { orderStatus: { $exists: false } },
                { paymentMethod: null },
                { paymentMethod: { $exists: false } },
                { paymentStatus: null },
                { paymentStatus: { $exists: false } },
            ],
        });

        if (problematicOrders.length > 0) {
            console.log(`\n🚨 Phát hiện ${problematicOrders.length} đơn hàng có vấn đề:`);
            problematicOrders.forEach((order, index) => {
                console.log(`\n🔎 Đơn hàng #${index + 1}:`);
                console.log(`  ID: ${order._id}`);
                console.log(`  OrderNumber: ${order.orderNumber || 'MISSING'}`);
                console.log(`  Created: ${order.createdAt}`);
                console.log(`  Status: ${order.orderStatus || 'MISSING'}`);
                console.log(`  Payment Method: ${order.paymentMethod || 'MISSING'}`);
                console.log(`  Payment Status: ${order.paymentStatus || 'MISSING'}`);
            });
        } else {
            console.log('\n✅ Không có đơn hàng nào có vấn đề');
        }
    } catch (err) {
        logError('Đã xảy ra lỗi trong quá trình phân tích', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Đã đóng kết nối MongoDB');
    }
}

analyzeOrders();
