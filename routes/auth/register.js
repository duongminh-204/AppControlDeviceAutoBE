const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const User = require('../../models/User');

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Thiếu email hoặc password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      userId: user._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;