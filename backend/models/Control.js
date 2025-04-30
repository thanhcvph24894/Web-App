const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function (v) {
                return !v || v < this.price;
            },
            message: 'Giá khuyến mãi phải nhỏ hơn giá gốc'
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    sold: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    colors: [{
        type: String,
        trim: true
    }],
    sizes: [{
        type: String,
        trim: true
    }],
    specifications: [{
        name: { type: String, trim: true },
        value: { type: String, trim: true }
    }],
    tags: [String],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, {
    timestamps: true
});

// Tính trung bình đánh giá trước khi lưu hoặc cập nhật
productSchema.pre('save', function (next) {
    if (this.ratings && this.ratings.length > 0) {
        const total = this.ratings.reduce((acc, item) => acc + (item.rating || 0), 0);
        this.averageRating = Math.round((total / this.ratings.length) * 10) / 10; // Làm tròn 1 số sau dấu chấm
    } else {
        this.averageRating = 0;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
