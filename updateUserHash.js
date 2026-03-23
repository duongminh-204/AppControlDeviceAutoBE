require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { User } = require('./index'); // import model User

async function hashAllPasswordsFromJSON() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // Đọc file JSON
    const rawData = fs.readFileSync('./user_account.json', 'utf-8');
    const usersJSON = JSON.parse(rawData);

    console.log(`Found ${usersJSON.length} users in JSON`);

    for (const u of usersJSON) {
      if (!u.email || !u.password) {
        console.log(`Skipped invalid entry: ${JSON.stringify(u)}`);
        continue;
      }

      // Hash password
      const hashed = await bcrypt.hash(u.password, 10);

      // Upsert vào DB: nếu user đã tồn tại update passwordHash, nếu chưa tồn tại create mới
      await User.updateOne(
        { email: u.email },
        { $set: { passwordHash: hashed } },
        { upsert: true }
      );

      console.log(`Hashed/Updated password for ${u.email}`);
    }

    console.log('All passwords from JSON processed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

hashAllPasswordsFromJSON();
// node updateUserHash.js trên terminal khi có thay đổi info acc để hash