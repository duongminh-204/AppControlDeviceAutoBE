require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const os = require('os');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// ROUTES
const loginRoute = require('./routes/auth/login');
const registerRoute = require('./routes/auth/register');
const meRoute = require('./routes/auth/me');
const deviceRoutes = require('./routes/deviceRoutes');
const googleRoute = require('./routes/auth/google.js');
const passport = require('passport');

app.use(passport.initialize());
app.use('/auth/google', googleRoute);
app.use('/auth/login', loginRoute);
app.use('/auth/register', registerRoute);
app.use('/auth/me', meRoute);
app.use('/api', deviceRoutes);

// TEST
app.get('/ping', (req, res) => {
  res.send('OK');
});

// Lấy IP
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

const PORT = process.env.PORT || 3000;
const ip = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server chạy tại http://${ip}:${PORT}`);
});