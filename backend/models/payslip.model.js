'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payslip extends Model {
    static associate(models) {
      // define association here
      Payslip.belongsTo(models.PayrollRun, { foreignKey: 'payrollRunId', as: 'payrollRun' });
      Payslip.hasMany(models.PayslipItem, { foreignKey: 'payslipId', as: 'payslipItems' });
      Payslip.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' }); // Added Employee association
      // Payslip.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' }); // Example for future
    }
  }

  Payslip.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Essential foreign keys for context, assuming these are implicitly required
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      // references: { model: 'tenants', key: 'id' }, // No associations
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      // references: { model: 'employees', key: 'id' }, // No associations
    },
    payrollRunId: {
      type: DataTypes.UUID,
      allowNull: false,
      // references: { model: 'payroll_runs', key: 'id' }, // No associations
    },
    grossPay: {
      type: DataTypes.DECIMAL(12, 2), // Precision 12, 2 decimal places
      allowNull: false,
      defaultValue: 0.00,
    },
    deductions: { // Total non-tax deductions
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    taxes: { // Total tax deductions
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    netPay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // payment_date: { // Often inherited from PayrollRun, but could be here if individual slips vary
    //   type: DataTypes.DATEONLY,
    //   allowNull: true,
    // },
    // pay_period_start: {
    //   type: DataTypes.DATEONLY,
    //   allowNull: true,
    // },
    // pay_period_end: {
    //   type: DataTypes.DATEONLY,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'Payslip',
    tableName: 'payslips',
    timestamps: true, // createdAt, updatedAt
    paranoid: true,   // For soft deletes, if payslip history needs to be robustly kept
    // underscored: true, // Removed for camelCase consistency
    indexes: [
      // { fields: ['tenantId'] }, // Updated for camelCase if associations restored
      // { fields: ['employeeId'] }, // Updated for camelCase if associations restored
      { fields: ['payrollRunId'] }, // Updated to camelCase
      // A payslip should be unique per employee per payroll run
      {
        unique: true,
        fields: ['employeeId', 'payrollRunId'], // Updated to camelCase
        name: 'unique_employee_payslip_for_run' // Name can remain snake_case
      }
    ]
  });

  return Payslip;
};
