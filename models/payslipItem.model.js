'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayslipItem extends Model {
    // No associate method as per request
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
      allowNull: false,
      // references: { model: 'tenants', key: 'id' }, // No associations
    },
    payslipId: {
      type: DataTypes.UUID,
      allowNull: false,
      // references: { model: 'payslips', key: 'id' }, // No associations
    },
    // salaryComponentId: { // Would normally link to SalaryComponent model
    //   type: DataTypes.UUID,
    //   allowNull: true, // Or false if every item must be from a predefined component
    //   // references: { model: 'salary_components', key: 'id' }, // No associations
    // },
    description: { // e.g., "Basic Salary", "Income Tax", "Health Insurance Premium"
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: { // To classify the item, e.g., earning, deduction, tax, reimbursement
      type: DataTypes.ENUM('earning', 'deduction', 'tax', 'reimbursement', 'employer_contribution', 'other'),
      allowNull: false,
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
      // { fields: ['tenant_id'] }, // Add back if associations are restored
      // { fields: ['payslip_id'] }, // Add back if associations are restored
      // { fields: ['salary_component_id'] }, // Add back if associations are restored
    ]
    // No specific unique indexes here by default, as a payslip can have multiple items of the same type
    // (e.g., multiple "other" earnings or deductions with different descriptions).
    // Uniqueness might be handled by (payslipId, description, type) if needed, but often not required.
  });

  return PayslipItem;
};
