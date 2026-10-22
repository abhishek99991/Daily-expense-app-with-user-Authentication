const { Expense } = require("../models");

exports.getExpenses = async (req, res) => {
  try {
    // Always filter by the verified user's ID.
    const expenses = await Expense.findAll({
      where: { userId: req.userId },
      order: [["date", "DESC"], ["createdAt", "DESC"]]
    });

    return res.json({ expenses });
  } catch (error) {
    console.error("Get expenses error:", error);
    return res.status(500).json({ message: "Could not load expenses." });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "Other").trim();
    const date = String(req.body.date || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a number greater than zero." });
    }
    if (!description || description.length > 255) {
      return res.status(400).json({ message: "Description is required (maximum 255 characters)." });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ message: "Please provide a valid date in YYYY-MM-DD format." });
    }

    // Crucial: userId comes from verified JWT middleware, never from req.body.
    const expense = await Expense.create({
      amount,
      description,
      category: category || "Other",
      date,
      userId: req.userId
    });

    return res.status(201).json({
      message: "Expense added successfully.",
      expense
    });
  } catch (error) {
    console.error("Add expense error:", error);
    return res.status(500).json({ message: "Could not add expense." });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = Number(req.params.id);
    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({ message: "Invalid expense ID." });
    }

    // Both conditions must match: expense ID AND authenticated owner ID.
    const deletedCount = await Expense.destroy({
      where: {
        id: expenseId,
        userId: req.userId
      }
    });

    if (deletedCount === 0) {
      // Same response for missing and other users' expenses avoids revealing ownership.
      return res.status(404).json({ message: "Expense not found." });
    }

    return res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({ message: "Could not delete expense." });
  }
};
