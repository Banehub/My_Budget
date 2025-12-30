const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://williefbeukes:dAZlNQUZCBcKBi58@cluster0.ra02y7n.mongodb.net/budget_app';
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const dbName = conn.connection.db.databaseName;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${dbName}`);
    console.log(`All data (users, transactions, assets, accountgroups) will be saved in: ${dbName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

