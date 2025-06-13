const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');

const genOtp = () => Math.floor(1000 + Math.random() * 9000);

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required!" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists.' });
    const otp = genOtp();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    const user = new User({ email, password, otp, otpExpires });
    await user.save();
    await sendEmail(email, `Your OTP is ${otp}.`);
    res.status(201).json({ message: "User created! Please verify your email.", user: { email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log(user.password === password)
    if (!user || !(user.password === password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      const otp = genOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000;
      await user.save();
      await sendEmail(email, `Your OTP is ${otp}.`);
      return res.status(200).json({ message: 'Please verify your email first.', user: { email: user.email } });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { email: user.email, isVerified: user.isVerified } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { otp, email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== Number(otp)) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > user.otpExpires) return res.status(400).json({ message: 'OTP expired' });

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ message: 'Email verified successfully.', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = genOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();
    await sendEmail(email, `Your new OTP is ${otp}`);

    res.json({ message: 'New OTP sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};