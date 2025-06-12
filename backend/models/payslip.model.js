'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payslip extends Model {
    static associate(models) {
      // define association here
      Payslip.belongsTo(models.PayrollRun, { foreignKey: 'payrollRunId', as: 'payrollRun' });
      Payslip.hasMany(models.PayslipItem, { foreignKey: 'payslipId', as: 'payslipItems' });
      Payslip.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' }); // Added Employee association
      Payslip.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
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
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If a tenant is deleted, their payslips are also deleted
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'employees', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT', // Prevent deleting an employee if payslips exist
    },
    payrollRunId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'payroll_runs', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT', // Prevent deleting a payroll run if payslips exist
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
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['employee_id'] },
      { fields: ['payroll_run_id'] },
      // A payslip should be unique per employee per payroll run
      {
        unique: true,
        fields: ['employee_id', 'payroll_run_id'],
        name: 'unique_employee_payslip_for_run'
      }
    ]
  });

  return Payslip;
};
