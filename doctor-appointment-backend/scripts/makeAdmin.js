// scripts/makeAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const User = require(path.join(__dirname, '..', 'models', 'User'));

(async () => {
  const [username, password] = process.argv.slice(2);
  if (!username) {
    console.error('usage: node scripts/makeAdmin.js <username> [password]');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  let u = await User.findOne({ username });
  if (!u) {
    if (!password) {
      console.error('User not found. Provide a password to create it.');
      process.exit(1);
    }
    u = new User({ username, password, role: 'admin' });
    await u.save();
    console.log('Created admin:', username);
  } else {
    if (password) u.password = password; // optional reset
    u.role = 'admin';
    await u.save();
    console.log('Promoted to admin:', username);
  }
  await mongoose.disconnect();
  process.exit(0);
})();
