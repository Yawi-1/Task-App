const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: Number,
  otpExpires: Date
});

module.exports = mongoose.model('User', userSchema);
