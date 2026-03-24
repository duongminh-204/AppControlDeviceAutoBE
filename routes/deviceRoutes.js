const express = require('express');
const router = express.Router();

const DeviceData = require('../models/DeviceData');

// ESP32 gửi data
router.post('/device-data', async (req, res) => {
  try {
    const data = req.body;

    const newData = new DeviceData(data);
    await newData.save();

    console.log("ESP32:", data);

    res.json({ message: "Saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy data theo deviceId
router.get('/device-data/:deviceId', async (req, res) => {
  try {
    const data = await DeviceData.find({
      deviceId: req.params.deviceId
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;