const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AccountGroup = require('../models/AccountGroup');
const { generateToken, authenticate } = require('../middleware/auth');
const { generateUserCode, getAccountGroupId } = require('../utils/helpers');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, invitationCode } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Generate unique user code
    let userCode;
    let isUnique = false;
    while (!isUnique) {
      userCode = generateUserCode();
      const codeExists = await User.findOne({ userCode });
      if (!codeExists) {
        isUnique = true;
      }
    }

    // Handle invitation code if provided
    let invitedByCode = null;
    let accountGroupId = null;

    if (invitationCode) {
      if (invitationCode.length !== 6) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invitation code format',
        });
      }

      const inviter = await User.findOne({ userCode: invitationCode });
      if (!inviter) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invitation code',
        });
      }

      invitedByCode = invitationCode;
      // Get or create account group
      accountGroupId = await getAccountGroupId(inviter, AccountGroup);
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      userCode,
      invitedByCode,
      accountGroup: accountGroupId,
    });

    // If no invitation code, create account group for this user
    if (!accountGroupId) {
      const newGroup = await AccountGroup.create({
        groupCode: userCode,
        createdBy: user._id,
      });
      user.accountGroup = newGroup._id;
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        userCode: user.userCode,
        invitedByCode: user.invitedByCode || undefined,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        userCode: user.userCode,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

// Verify JWT token and get current user
router.get('/verify', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        userCode: req.user.userCode,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
    });
  }
});

module.exports = router;

