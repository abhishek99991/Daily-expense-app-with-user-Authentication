# Expense Tracker — JWT + Sequelize + SQLite

A full-stack learning project that demonstrates:
- User registration and login
- Password hashing with bcrypt
- JWT authentication
- One-to-many relationship between User and Expense
- Add/list/delete only the authenticated user's expenses

## Requirements
- Node.js 18 or newer
- npm

## Run on Windows
1. Extract the ZIP.
2. Open the extracted `expense-tracker-jwt` folder in VS Code.
3. Open a terminal in that folder.
4. Install packages:

   ```bash
   npm install
   ```

5. Copy `.env.example` to `.env`.
   - In PowerShell: `Copy-Item .env.example .env`
   - Open `.env` and replace `JWT_SECRET` with a long random secret.
6. Start the server:

   ```bash
   npm start
   ```

7. Open http://localhost:3000 in your browser.
8. Create two accounts and test that each account sees only its own expenses.

The `database.sqlite` file is created automatically on first run.

## API endpoints

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/expenses` | Bearer token | List the logged-in user's expenses |
| POST | `/api/expenses` | Bearer token | Add expense for the logged-in user |
| DELETE | `/api/expenses/:id` | Bearer token | Delete an expense only if it belongs to the logged-in user |
| GET | `/api/health` | No | Health check |

### Example add-expense request

Header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "amount": 250,
  "description": "Lunch",
  "category": "Food",
  "date": "2026-10-22"
}
```

Do not send `userId` from the frontend. The server gets the owner ID from the verified JWT and stores it as `userId`.

## Important code for the assignment

In `controllers/expenseController.js` when creating an expense:

```js
const expense = await Expense.create({
  amount,
  description,
  category,
  date,
  userId: req.userId
});
```

When deleting:

```js
const deletedCount = await Expense.destroy({
  where: {
    id: expenseId,
    userId: req.userId
  }
});
```

Both conditions must match, so a user cannot delete another user's expense.

## Project structure

```text
expense-tracker-jwt/
├── controllers/
│   ├── authController.js
│   └── expenseController.js
├── middleware/
│   └── authenticateUser.js
├── models/
│   ├── Expense.js
│   ├── User.js
│   └── index.js
├── public/
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
├── routes/
│   ├── authRoutes.js
│   └── expenseRoutes.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Notes
- This is an educational local project. For production, consider secure HttpOnly cookies instead of localStorage for token storage, CSRF protections where relevant, rate limiting, HTTPS, stricter validation, and database migrations.
- Never commit `.env` or your JWT secret.
