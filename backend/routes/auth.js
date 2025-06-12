const express = require('express');
const router = express.Router();
const { signup, login,verifyEmail,resendOtp } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.put('/verifyEmail', verifyEmail);
router.post('/resendOtp', resendOtp);

module.exports = router;
