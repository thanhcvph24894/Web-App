const jwt = require('jsonwebtoken');
const User = require('../../models/User');

exports.protect = async (req, res, next) => {
    let token;

    // 1. Lấy token từ header
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Nếu không có token
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không có quyền truy cập. Vui lòng đăng nhập.'
        });
    }

    try {
        // 3. Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Tìm user theo ID, loại bỏ mật khẩu
        const user = await User.findById(decoded.id).select('-password');

        // 5. Nếu không tìm thấy user
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại.'
            });
        }

        // 6. Gán user vào request
        req.user = user;
        next();
    } catch (error) {
        console.error('Lỗi xác thực JWT:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn.'
        });
    }
};
