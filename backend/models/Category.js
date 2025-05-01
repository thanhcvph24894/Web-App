const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
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
        trim: true,
        default: ''
    },
    image: {
        type: String,
        trim: true,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 🔧 Pre-save middleware: auto-generate slug from name
categorySchema.pre('validate', function (next) {
    if (this.name && !this.slug) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// 🔎 Virtual property: full image URL
categorySchema.virtual('imageUrl').get(function () {
    if (!this.image) return '';
    return `https://yourdomain.com/uploads/categories/${this.image}`;
});

// 🔁 Instance method: toggle active status
categorySchema.methods.toggleActive = function () {
    this.isActive = !this.isActive;
    return this.save();
};

// 📦 Static method: get all active categories
categorySchema.statics.getActiveCategories = function () {
    return this.find({ isActive: true }).sort({ order: 1 });
};

module.exports = mongoose.model('Category', categorySchema);
