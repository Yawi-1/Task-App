const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(404).json({ message: "Email is required !" });
    return;
  }
  if (!password) {
    res.status(404).json({ message: "Password is required !" });
    return;
  }
  try {
    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({ message: 'User already exists .' })
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 5 * 60 * 1000;
    const user = await new User({ email, password, otp, otpExpires });
    await user.save();
    await sendEmail(email, `Your otp is ${otp}.`)
    res.status(201).json({ message: "User created successfully !", user });
  } catch (error) {

  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }); 
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const user = await User.findOne({ email });
    if (user.otp !== Number(otp)) {
      return res.json({ message: 'Invalid otp' })
    }
    if (Date.now() > user.otpExpires) {
      return res.json({ message: 'Otp expired' })
    }
    user.otp = undefined;
    user.isVerified = true;
    user.otpExpires = undefined;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log(token)
    res.json({ message: 'Email verification done.',  token });
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 5 * 60 * 1000;
    const user = await User.findOne({ email });
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    await sendEmail(email, `You New Otp for verification is ${otp}`);
    res.json({ message: 'New verification otp sent !' })
  } catch (error) {
    res.json({ message: error.message })
  }
}
