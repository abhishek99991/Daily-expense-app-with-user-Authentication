const express = require("express");
const authenticateUser = require("../middleware/authenticateUser");
const {
  getExpenses,
  addExpense,
  deleteExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.use(authenticateUser);
router.get("/", getExpenses);
router.post("/", addExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
