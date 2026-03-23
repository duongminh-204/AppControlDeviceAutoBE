require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const os = require('os');
const passport = require('passport');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import model User
const User = require('./models/User');

// Middleware kiểm tra JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Khởi tạo Google OAuth
const setupGoogleAuth = require('./googleAuth');
setupGoogleAuth(app, jwt);

// Endpoint đăng ký
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email là bắt buộc' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Mật khẩu là bắt buộc' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
    });

    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      userId: user._id,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
});

// Endpoint đăng nhập thông thường (email + password)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
});

// Endpoint lấy thông tin user hiện tại (đã auth)
app.get('/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});

// Endpoint ping để mobile auto-detect server IP
app.get('/ping', (req, res) => {
  res.send('OK');
});

// Hàm lấy IP local (dùng để log khi chạy server)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Khởi động server
const PORT = process.env.PORT || 3000;
const ip = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy tại:`);
  console.log(`   Local: http://${ip}:${PORT}`);
  console.log(`   Ngrok (nếu dùng): https://your-ngrok-url.ngrok-free.app`);
  console.log(`   Thời gian: ${new Date().toLocaleString('vi-VN')}`);
});