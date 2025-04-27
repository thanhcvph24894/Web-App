// authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Giả lập database người dùng
let users = [];
let refreshTokens = [];

// Hàm validate email
const isValidEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

// Hàm tạo access token
const generateAccessToken = (user) => {
    return jwt.sign({ username: user.username }, 'access_secret_key', { expiresIn: '15m' });
};

// Hàm tạo refresh token
const generateRefreshToken = (user) => {
    return jwt.sign({ username: user.username }, 'refresh_secret_key', { expiresIn: '7d' });
};

// Controller: Register
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kiểm tra dữ liệu
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Kiểm tra username hoặc email đã tồn tại
        const userExists = users.find(user => user.username === username || user.email === email);
        if (userExists) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        users.push(newUser);

        res.status(201).json({ message: 'User registered successfully', user: { username: newUser.username, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller: Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra dữ liệu
        if (!username || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = users.find(user => user.username === username);

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        refreshTokens.push(refreshToken);

        res.status(200).json({
            accessToken,
            refreshToken
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller: Logout
const logout = (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        refreshTokens = refreshTokens.filter(t => t !== token);

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller: Refresh Token
const refreshToken = (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        if (!refreshTokens.includes(token)) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        jwt.verify(token, 'refresh_secret_key', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            const newAccessToken = generateAccessToken({ username: user.username });

            res.status(200).json({ accessToken: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller: Get all users (for testing)
const getAllUsers = (req, res) => {
    res.status(200).json({ users });
};

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    getAllUsers
};
