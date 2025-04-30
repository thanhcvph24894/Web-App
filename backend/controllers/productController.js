const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

class ProductController {
    async index(req, res, next) {
        try {
            const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 });
            res.render('pages/products/index', { title: 'Quản lý sản phẩm', products, messages: req.flash() });
        } catch (err) { next(err); }
    }

    async showCreateForm(req, res, next) {
        try {
            const categories = await Category.find({ isActive: true });
            res.render('pages/products/create', { title: 'Thêm sản phẩm mới', categories, messages: req.flash() });
        } catch (err) { next(err); }
    }

    async create(req, res, next) {
        try {
            const productData = this.prepareData(req.body, req.files);
            await Product.create(productData);
            req.flash('success', 'Thêm sản phẩm thành công');
            res.redirect('/products');
        } catch (err) {
            this.cleanupFiles(req.files);
            req.flash('error', err.message);
            res.redirect('/products/create');
        }
    }

    async showEditForm(req, res, next) {
        try {
            const [product, categories] = await Promise.all([
                Product.findById(req.params.id).populate('category'),
                Category.find({ isActive: true })
            ]);
            if (!product) return this.notFoundRedirect(req, res, '/products');
            res.render('pages/products/edit', { title: 'Chỉnh sửa sản phẩm', product, categories, messages: req.flash() });
        } catch (err) { next(err); }
    }

    async update(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) throw new Error('Không tìm thấy sản phẩm');
            if (req.files?.length) this.removeImages(product.images);
            const updateData = this.prepareData(req.body, req.files);
            await Product.findByIdAndUpdate(req.params.id, updateData);
            req.flash('success', 'Cập nhật sản phẩm thành công');
            res.redirect('/products');
        } catch (err) {
            this.cleanupFiles(req.files);
            req.flash('error', err.message);
            res.redirect(`/products/edit/${req.params.id}`);
        }
    }

    async delete(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            this.removeImages(product.images);
            await Product.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: 'Xóa sản phẩm thành công' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message || 'Lỗi xóa sản phẩm' });
        }
    }

    async updateStatus(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
            if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            res.json({ success: true, message: `Đã ${product.isActive ? 'kích hoạt' : 'ngừng bán'} sản phẩm`, isActive: product.isActive });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message || 'Lỗi cập nhật trạng thái' });
        }
    }

    prepareData(body, files) {
        return {
            name: body.name.trim(),
            slug: slugify(body.name, { lower: true, locale: 'vi', strict: true }),
            description: body.description?.trim() || '',
            price: parseFloat(body.price.replace(/[^\d]/g, '')),
            stock: parseInt(body.stock),
            category: body.category,
            isActive: body.isActive === 'on',
            colors: this.splitArray(body.colors),
            sizes: this.splitArray(body.sizes),
            images: files?.length ? this.saveFiles(files) : []
        };
    }

    splitArray(input) {
        return Array.isArray(input) ? input : input?.split(',').map(i => i.trim()) || [];
    }

    saveFiles(files) {
        return files.map(file => '/uploads/products/' + file.filename);
    }

    cleanupFiles(files) {
        files?.forEach(file => {
            const filePath = path.join(__dirname, '../public/uploads/products', file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    }

    removeImages(images) {
        images?.forEach(image => {
            const imagePath = path.join(__dirname, '../public', image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        });
    }

    notFoundRedirect(req, res, path) {
        req.flash('error', 'Không tìm thấy sản phẩm');
        res.redirect(path);
    }
}

module.exports = new ProductController();
