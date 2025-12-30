const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Asset = require('../models/Asset');
const { getAccountGroupId } = require('../utils/helpers');
const AccountGroup = require('../models/AccountGroup');

// Get all assets for the authenticated user (and shared account)
router.get('/', authenticate, async (req, res) => {
  try {
    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    const assets = await Asset.find({ accountGroupId })
      .sort({ date: -1, createdAt: -1 })
      .select('_id name amount date createdAt updatedAt');

    const total = assets.reduce((sum, asset) => sum + asset.amount, 0);

    res.json({
      success: true,
      assets: assets.map((a) => ({
        id: a._id,
        name: a.name,
        amount: a.amount,
        date: a.date.toISOString(),
      })),
      total: parseFloat(total.toFixed(2)),
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create a new asset
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, amount, date } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Asset name is required',
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    const asset = new Asset({
      userId: req.user._id,
      accountGroupId,
      name: name.trim(),
      amount,
      date: date ? new Date(date) : new Date(),
    });

    await asset.save();

    res.status(201).json({
      success: true,
      asset: {
        id: asset._id,
        name: asset.name,
        amount: asset.amount,
        date: asset.date.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Update an asset
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount } = req.body;
    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    const asset = await Asset.findOne({
      _id: id,
      accountGroupId,
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Asset name must be a non-empty string',
        });
      }
      asset.name = name.trim();
    }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
      }
      asset.amount = amount;
    }

    await asset.save();

    res.json({
      success: true,
      asset: {
        id: asset._id,
        name: asset.name,
        amount: asset.amount,
        date: asset.date.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete an asset
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    const asset = await Asset.findOne({
      _id: id,
      accountGroupId,
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    await Asset.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Asset deleted',
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;

