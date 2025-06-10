'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollRun extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PayrollRun.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false,
      });
      PayrollRun.belongsTo(models.PaySchedule, {
        foreignKey: 'payScheduleId',
        as: 'paySchedule',
        allowNull: false,
      });
      PayrollRun.belongsTo(models.User, {
        foreignKey: 'processedByUserId',
        as: 'processedByUser',
        allowNull: true, // Might be automated or system-initiated initially
      });
      PayrollRun.belongsTo(models.User, {
        foreignKey: 'approvedByUserId',
        as: 'approvedByUser',
        allowNull: true, // Null until approved
      });

      // A PayrollRun will have many detailed items, one for each employee included.
      // Assuming a model named PayrollItem or EmployeePayroll.
      PayrollRun.hasMany(models.PayrollItem, { // Replace PayrollItem with your actual model name
        foreignKey: 'payrollRunId',
        as: 'payrollItems',
      });
    }
  }

  PayrollRun.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    payScheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'pay_schedules', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'RESTRICT', // Don't delete schedule if runs exist
    },
    pay_period_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pay_period_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_date: { // Date employees get paid
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'pending',      // Payroll period identified, not yet processed
        'processing',   // Calculations are being run
        'pending_review',// Calculations done, ready for admin review
        'pending_approval',// Reviewed, waiting for final approval
        'approved',     // Approved, ready for payment execution
        'paid',         // Payments successfully executed
        'partially_paid',// Some payments made, some failed
        'failed',       // Processing or payment execution failed
        'cancelled'     // Cancelled before processing/payment
      ),
      defaultValue: 'pending',
      allowNull: false,
    },
    // Aggregate numbers - these would typically be calculated from PayrollItems
    total_employees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_gross_pay: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_deductions: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_net_pay: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_employer_taxes: { // Or other employer contributions
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    processedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    approvedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    processed_at: { // Timestamp when processing started/completed
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_at: { // Timestamp of approval
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: { // Any general notes for this payroll run
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'PayrollRun',
    tableName: 'payroll_runs',
    timestamps: true,
    paranoid: true, // Keep history of payroll runs
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['pay_schedule_id'] },
      { fields: ['status'] },
      { fields: ['payment_date'] },
      // A tenant shouldn't have two payroll runs for the exact same pay schedule and period end date.
      {
        unique: true,
        fields: ['tenant_id', 'pay_schedule_id', 'pay_period_end_date'],
        name: 'unique_tenant_schedule_period_run'
      }
    ]
  });

  return PayrollRun;
};
