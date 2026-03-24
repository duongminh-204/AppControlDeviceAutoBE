const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  status: String,
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeviceData', deviceSchema);