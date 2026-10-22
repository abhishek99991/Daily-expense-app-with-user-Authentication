require("dotenv").config();

const path = require("path");
const express = require("express");
const { sequelize } = require("./models");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET. Copy .env.example to .env and set a secret.");
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ message: "Expense Tracker API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connected and models synchronized.");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
