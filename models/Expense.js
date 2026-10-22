module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Expense", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 }
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 255] }
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: "Other"
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: "Expenses",
    timestamps: true
  });
};
