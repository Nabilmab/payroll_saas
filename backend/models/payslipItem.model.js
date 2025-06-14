'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayslipItem extends Model {
    static associate(models) {
      // define association here
      PayslipItem.belongsTo(models.SalaryComponent, { foreignKey: 'salaryComponentId', as: 'salaryComponent' });
      PayslipItem.belongsTo(models.Payslip, { foreignKey: 'payslipId', as: 'payslip' });
      PayslipItem.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  PayslipItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Essential foreign keys for context
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false, // Assuming payslip items must be tied to a tenant
      references: {
          model: 'tenants', // Name of the Tenant table
          key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Or 'RESTRICT' based on desired behavior
    },
    payslipId: {
      type: DataTypes.UUID,
      allowNull: false,
      // FIX: Enabled the foreign key constraint for data integrity.
      references: { model: 'payslips', key: 'id' },
    },
    salaryComponentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'salary_components', // Name of the target table
        key: 'id',                  // Key in the target table that we're referencing
      },
    },
    description: { // e.g., "Basic Salary", "Income Tax", "Health Insurance Premium"
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: { // To classify the item, e.g., earning, deduction, tax, reimbursement
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['earning', 'deduction', 'tax', 'reimbursement', 'employer_contribution', 'other']],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2), // Precision 12, 2 decimal places
      allowNull: false,
      defaultValue: 0.00,
    },
    // order: { // Optional: for ordering items on the payslip display
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'PayslipItem',
    tableName: 'payslip_items',
    timestamps: true, // createdAt, updatedAt
    // No 'paranoid' typically for payslip items, they live and die with the payslip.
    // If a payslip is soft-deleted, its items effectively are too via FK relationship (when active).
    underscored: true, // For snake_case column names
    indexes: [
      // FIX: Use snake_case column names when `underscored: true` is set.
      { fields: ['tenantId'] },
      { fields: ['payslipId'] },
      { fields: ['salaryComponentId'] },
    ]
    // No specific unique indexes here by default, as a payslip can have multiple items of the same type
    // (e.g., multiple "other" earnings or deductions with different descriptions).
    // Uniqueness might be handled by (payslipId, description, type) if needed, but often not required.
  });

  return PayslipItem;
};