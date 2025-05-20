const mongoose = require('mongoose');
const slugify = require('slugify');

// 🧩 Define the schema for categories
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters'],
        maxlength: [100, 'Category name must be at most 100 characters']
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

// 🔧 Middleware: Automatically generate a unique slug before validation
categorySchema.pre('validate', async function (next) {
    if (this.name && !this.slug) {
        let baseSlug = slugify(this.name, { lower: true, strict: true });
        let slug = baseSlug;
        let count = 1;

        // 🔄 Ensure uniqueness by appending a number if needed
        while (await mongoose.models.Category.findOne({ slug })) {
            slug = `${baseSlug}-${count}`;
            count++;
        }

        this.slug = slug;
    }

    next();
});

// 🔎 Virtual field: Get the full image URL for frontend usage
categorySchema.virtual('imageUrl').get(function () {
    if (!this.image) return '';
    return `https://yourdomain.com/uploads/categories/${this.image}`;
});

// 🌀 Instance method: Toggle the active status of a category
categorySchema.methods.toggleActive = async function () {
    this.isActive = !this.isActive;
    await this.save();
    return this;
};

// 📊 Static method: Get all categories that are active
categorySchema.statics.getActiveCategories = function () {
    return this.find({ isActive: true }).sort({ order: 1 });
};

// 🔍 Static method: Search categories by name (case-insensitive)
categorySchema.statics.searchByName = function (keyword) {
    const regex = new RegExp(keyword, 'i');
    return this.find({ name: regex });
};

// 🧮 Static method: Count how many categories are currently active
categorySchema.statics.countActive = function () {
    return this.countDocuments({ isActive: true });
};

// 📁 Static method: Get all categories sorted by order, even inactive
categorySchema.statics.getAllSorted = function () {
    return this.find().sort({ order: 1, name: 1 });
};

// 🧹 Middleware: Clean and format image filename before saving
categorySchema.pre('save', function (next) {
    if (this.image) {
        this.image = this.image.trim().toLowerCase().replace(/\s+/g, '-');
    }
    next();
});

// 📦 Export the model to use in other parts of the app
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
