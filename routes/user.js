const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// Get current user information
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        userCode: user.userCode,
        invitedByCode: user.invitedByCode || undefined,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Verify if a user code exists (for invitation validation)
router.get('/code/:userCode', async (req, res) => {
  try {
    const { userCode } = req.params;

    if (!userCode || userCode.length !== 6) {
      return res.json({
        success: true,
        exists: false,
      });
    }

    const user = await User.findOne({ userCode }).select('email userCode');

    if (!user) {
      return res.json({
        success: true,
        exists: false,
      });
    }

    res.json({
      success: true,
      exists: true,
      user: {
        id: user._id,
        email: user.email,
        userCode: user.userCode,
      },
    });
  } catch (error) {
    console.error('Verify user code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;

