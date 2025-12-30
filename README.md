# Budget API

A RESTful API for managing budgets, transactions, and assets with shared account functionality.

## Features

- User authentication with JWT
- Transaction management (income/expense)
- Asset management
- Shared accounts via invitation codes
- Transaction statistics and filtering

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (see `.env.example` for reference)

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### User
- `GET /api/user` - Get current user information
- `GET /api/user/code/:userCode` - Verify if a user code exists

### Transactions
- `GET /api/transactions` - Get all transactions (with optional filters)
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/stats` - Get transaction statistics
- `DELETE /api/transactions/:id` - Delete a transaction

### Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Create a new asset
- `PUT /api/assets/:id` - Update an asset
- `DELETE /api/assets/:id` - Delete an asset

## Shared Accounts

Users can share accounts using invitation codes. When a user registers with an invitation code, they are linked to the same account group. All transactions and assets are shared among users in the same group.

