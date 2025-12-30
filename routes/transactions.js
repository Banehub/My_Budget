const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const { getAccountGroupId } = require('../utils/helpers');
const AccountGroup = require('../models/AccountGroup');

// Get all transactions for the authenticated user (and shared account)
router.get('/', authenticate, async (req, res) => {
  try {
    const { year, month, type } = req.query;
    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    // Build query
    const query = { accountGroupId };

    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    if (year || month !== undefined) {
      query.date = {};
      if (year) {
        const startYear = new Date(parseInt(year), 0, 1);
        const endYear = new Date(parseInt(year) + 1, 0, 1);
        query.date.$gte = startYear;
        query.date.$lt = endYear;
      }
      if (month !== undefined) {
        const monthNum = parseInt(month);
        if (monthNum >= 0 && monthNum <= 11) {
          const yearNum = year ? parseInt(year) : new Date().getFullYear();
          const startMonth = new Date(yearNum, monthNum, 1);
          const endMonth = new Date(yearNum, monthNum + 1, 1);
          query.date.$gte = startMonth;
          query.date.$lt = endMonth;
        }
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .select('_id type amount description date createdAt updatedAt');

    res.json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create a new transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;

    // Validation
    if (!type || (type !== 'income' && type !== 'expense')) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'income' or 'expense'",
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    const transaction = new Transaction({
      userId: req.user._id,
      accountGroupId,
      type,
      amount,
      description: description || (type === 'income' ? 'Income' : 'Expense'),
      date: date ? new Date(date) : new Date(),
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get transaction statistics for a specific month/year
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || month === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (monthNum < 0 || monthNum > 11) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 0 and 11',
      });
    }

    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 1);

    const transactions = await Transaction.find({
      accountGroupId,
      date: { $gte: startDate, $lt: endDate },
    });

    let income = 0;
    let expenses = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });

    const balance = income - expenses;
    const total = income + expenses;
    const incomePercentage = total > 0 ? (income / total) * 100 : 0;
    const expensePercentage = total > 0 ? (expenses / total) * 100 : 0;

    res.json({
      success: true,
      stats: {
        income: parseFloat(income.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        incomePercentage: parseFloat(incomePercentage.toFixed(2)),
        expensePercentage: parseFloat(expensePercentage.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete a transaction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const accountGroupId = await getAccountGroupId(req.user, AccountGroup);

    const transaction = await Transaction.findOne({
      _id: id,
      accountGroupId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    await Transaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Transaction deleted',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;

