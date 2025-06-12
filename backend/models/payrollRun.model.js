'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollRun extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * Content is commented out as per request.
     */
    static associate(models) {
      PayrollRun.hasMany(models.Payslip, {
        foreignKey: 'payrollRunId',
        as: 'payslips',
      });
      // PayrollRun.belongsTo(models.Tenant, {
      //   foreignKey: 'tenantId',
      //   as: 'tenant',
      //   allowNull: false,
      // });
      // PayrollRun.belongsTo(models.PaySchedule, {
      //   foreignKey: 'payScheduleId',
      //   as: 'paySchedule',
      //   allowNull: false,
      // });
      // PayrollRun.belongsTo(models.User, {
      //   foreignKey: 'processedByUserId',
      //   as: 'processedByUser',
      //   allowNull: true,
      // });
      // PayrollRun.belongsTo(models.User, {
      //   foreignKey: 'approvedByUserId',
      //   as: 'approvedByUser',
      //   allowNull: true,
      // });
    }
  }

  PayrollRun.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Assuming tenantId and payScheduleId are still desired for context
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      // references: { model: 'tenants', key: 'id' }, // Associations commented out
      // onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    payScheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      // references: { model: 'pay_schedules', key: 'id' }, // Associations commented out
      // onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    periodStart: { // Renamed from pay_period_start_date
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    periodEnd: { // Renamed from pay_period_end_date
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    paymentDate: { // Renamed from payment_date
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'pending', 'processing', 'pending_review', 'pending_approval',
        'approved', 'paid', 'partially_paid', 'failed', 'cancelled', 'archived', 'completed'
      ),
      defaultValue: 'pending_review',
      allowNull: false,
    },
    totalGrossPay: { // Renamed from total_gross_pay
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    totalDeductions: { // Renamed from total_deductions
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    totalNetPay: { // Renamed from total_net_pay
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    // Other fields like total_employees, total_employer_taxes, user IDs, timestamps
    // from the previous version are kept for completeness unless specified otherwise.
    totalEmployees: { // Renamed from total_employees
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalEmployerTaxes: { // Renamed from total_employer_taxes
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    processedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      // references: { model: 'users', key: 'id' }, // Associations commented out
      // onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    approvedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      // references: { model: 'users', key: 'id' }, // Associations commented out
      // onUpdate: 'CASCADE', onDelete: 'SET NULL',
    },
    processedAt: { // Renamed from processed_at
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedAt: { // Renamed from approved_at
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'PayrollRun',
    tableName: 'payroll_runs', // Keeping original table name
    timestamps: true,
    paranoid: true,
    underscored: true, // Ensuring this is active for snake_case column names
    indexes: [
      // { fields: ['tenantId'] }, // Model attribute, maps to tenant_id if associations restored
      // { fields: ['payScheduleId'] }, // Model attribute, maps to pay_schedule_id if associations restored
      { fields: ['status'] }, // Model attribute, maps to status
      { fields: ['paymentDate'] }, // Model attribute, maps to payment_date
      {
        unique: true,
        // Model attributes, will be mapped to snake_case for DB index creation by `underscored: true`
        fields: ['tenantId', 'payScheduleId', 'periodEnd', 'status'],
        name: 'unique_tenant_schedule_period_run' // Constraint name in DB
      }
    ]
  });

  return PayrollRun;
};
