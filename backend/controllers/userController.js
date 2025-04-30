const userService = require('../services/userService');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

class UserController {
    async index(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            res.render('pages/users/index', {
                title: 'Quản lý người dùng',
                users,
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    async showCreateForm(req, res) {
        res.render('pages/users/create', {
            title: 'Thêm người dùng mới',
            messages: req.flash()
        });
    }

    async create(req, res, next) {
        try {
            // Kiểm tra input đơn giản
            const { name, email, password, phone, address, role } = req.body;
            if (!name || !email || !password) {
                throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = {
                name,
                email,
                password: hashedPassword,
                phone,
                address,
                role,
                status: 'active'
            };

            if (req.file) {
                userData.avatar = '/uploads/avatars/' + req.file.filename;
            }

            await userService.createUser(userData);
            req.flash('success', 'Thêm người dùng thành công');
            res.redirect('/users');
        } catch (error) {
            this._deleteUploadedFile(req.file);
            req.flash('error', error.message);
            res.redirect('/users/create');
        }
    }

    async showEditForm(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);
            res.render('pages/users/edit', {
                title: 'Chỉnh sửa người dùng',
                user,
                messages: req.flash()
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const updateData = {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                role: req.body.role
            };

            if (req.body.password) {
                updateData.password = await bcrypt.hash(req.body.password, 10);
            }

            if (req.file) {
                const user = await userService.getUserById(req.params.id);
                if (user.avatar) {
                    this._deleteOldAvatar(user.avatar);
                }
                updateData.avatar = '/uploads/avatars/' + req.file.filename;
            }

            await userService.updateUser(req.params.id, updateData);
            req.flash('success', 'Cập nhật người dùng thành công');
            res.redirect('/users');
        } catch (error) {
            this._deleteUploadedFile(req.file);
            req.flash('error', error.message);
            res.redirect(`/users/edit/${req.params.id}`);
        }
    }

    async delete(req, res) {
        try {
            const user = await userService.deleteUser(req.params.id);

            if (user.avatar) {
                this._deleteOldAvatar(user.avatar);
            }

            res.json({
                success: true,
                message: 'Xóa người dùng thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateStatus(req, res) {
        try {
            await userService.updateStatus(req.params.id, req.body.status);
            res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công',
                status: req.body.status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Helper: Xóa file avatar mới upload nếu có lỗi
    _deleteUploadedFile(file) {
        if (file) {
            const filePath = path.join(__dirname, '../public/uploads/avatars', file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    // Helper: Xóa avatar cũ
    _deleteOldAvatar(avatarPath) {
        const fullPath = path.join(__dirname, '../public', avatarPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
}

module.exports = new UserController();

