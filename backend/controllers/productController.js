const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

class ProductController {
    // Hiển thị danh sách sản phẩm
    async index(req, res, next) {
        try {
            const products = await Product.find()
                .populate('category', 'name')
                .sort({ createdAt: -1 });
            
            res.render('pages/products/index', {
                title: 'Quản lý sản phẩm',
                products,
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    // Hiển thị form tạo sản phẩm
    async showCreateForm(req, res, next) {
        try {
            const categories = await Category.find({ isActive: true });
            res.render('pages/products/create', {
                title: 'Thêm sản phẩm mới',
                categories,
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    // Xử lý tạo sản phẩm mới
    async create(req, res, next) {
        try {
            const productData = this.prepareProductData(req.body);

            if (req.files?.length) {
                productData.images = this.handleFileUpload(req.files);
            }

            await Product.create(productData);
            req.flash('success', 'Thêm sản phẩm thành công');
            res.redirect('/products');
        } catch (error) {
            this.handleError(error, req.files);
            req.flash('error', error.message);
            res.redirect('/products/create');
        }
    }

    // Hiển thị form chỉnh sửa sản phẩm
    async showEditForm(req, res, next) {
        try {
            const [product, categories] = await Promise.all([
                Product.findById(req.params.id).populate('category'),
                Category.find({ isActive: true })
            ]);

            if (!product) {
                req.flash('error', 'Không tìm thấy sản phẩm');
                return res.redirect('/products');
            }

            res.render('pages/products/edit', {
                title: 'Chỉnh sửa sản phẩm',
                product,
                categories,
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    // Xử lý cập nhật sản phẩm
    async update(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) throw new Error('Không tìm thấy sản phẩm');

            const updateData = this.prepareProductData(req.body);

            if (req.files?.length) {
                this.deleteProductImages(product.images);
                updateData.images = this.handleFileUpload(req.files);
            }

            await Product.findByIdAndUpdate(req.params.id, updateData);
            req.flash('success', 'Cập nhật sản phẩm thành công');
            res.redirect('/products');
        } catch (error) {
            this.handleError(error, req.files);
            req.flash('error', error.message);
            res.redirect(`/products/edit/${req.params.id}`);
        }
    }

    // Xử lý xóa sản phẩm
    async delete(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

            this.deleteProductImages(product.images);
            await Product.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: 'Xóa sản phẩm thành công' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi xóa sản phẩm' });
        }
    }

    // Cập nhật trạng thái sản phẩm
    async updateStatus(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
            if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

            res.json({
                success: true,
                message: `Đã ${product.isActive ? 'kích hoạt' : 'ngừng bán'} sản phẩm thành công`,
                isActive: product.isActive
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi cập nhật trạng thái' });
        }
    }

    // Helper: chuẩn bị dữ liệu sản phẩm
    prepareProductData(body) {
        return {
            name: body.name.trim(),
            slug: slugify(body.name, { lower: true, locale: 'vi', strict: true }),
            description: body.description?.trim() || '',
            price: parseFloat(body.price.replace(/[^\d]/g, '')),
            stock: parseInt(body.stock),
            category: body.category,
            isActive: body.isActive === 'on',
            colors: this.prepareArray(body.colors),
            sizes: this.prepareArray(body.sizes)
        };
    }

    // Helper: chuẩn bị mảng từ chuỗi
    prepareArray(input) {
        return Array.isArray(input) ? input : input?.split(',').map(item => item.trim()) || [];
    }

    // Helper: xử lý upload file hình ảnh
    handleFileUpload(files) {
        return files.map(file => '/uploads/products/' + file.filename);
    }

    // Helper: xóa hình ảnh của sản phẩm
    deleteProductImages(images) {
        if (images?.length) {
            images.forEach(image => {
                const imagePath = path.join(__dirname, '../public', image);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });
        }
    }

    // Helper: xử lý lỗi và xóa các file đã upload
    handleError(error, files) {
        if (files?.length) {
            files.forEach(file => {
                const filePath = path.join(__dirname, '../public/uploads/products', file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }
        console.error('Lỗi:', error);
        throw error;
    }
}

module.exports = new ProductController();
