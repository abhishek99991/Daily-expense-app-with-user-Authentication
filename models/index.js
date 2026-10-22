const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "database.sqlite"),
  logging: false
});

const User = require("./User")(sequelize, DataTypes);
const Expense = require("./Expense")(sequelize, DataTypes);

// One user can have many expenses; each expense belongs to one user.
User.hasMany(Expense, {
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE"
});
Expense.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: false }
});

module.exports = { sequelize, User, Expense };
