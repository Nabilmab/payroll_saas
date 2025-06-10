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
      // PayrollRun.hasMany(models.PayrollItem, { // Or models.Payslip
      //   foreignKey: 'payrollRunId',
      //   as: 'payrollItems', // Or payslips
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
        'approved', 'paid', 'partially_paid', 'failed', 'cancelled'
      ),
      defaultValue: 'pending',
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
    total_employees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_employer_taxes: {
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
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_at: {
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
    underscored: true, // Will use period_start, period_end, payment_date in DB
                       // but totalGrossPay etc. will be totalGrossPay in DB.
                       // For consistency, I should probably stick to one naming convention.
                       // The prompt implies camelCase for attributes, so I'll remove underscored: true
                       // and ensure DB columns match model field names if that's the intent.
                       // OR, keep underscored: true and ensure JS names are consistently camelCase.
                       // I will keep underscored:true for now as it was in the previous version,
                       // meaning DB columns will be snake_case for fields like periodStart.
    indexes: [
      // { fields: ['tenant_id'] }, // Re-add if associations are restored
      // { fields: ['pay_schedule_id'] }, // Re-add if associations are restored
      { fields: ['status'] },
      { fields: ['payment_date'] }, // This will be payment_date in DB due to underscored:true
      {
        unique: true,
        fields: ['tenant_id', 'pay_schedule_id', 'period_end'], // period_end due to underscored:true
        name: 'unique_tenant_schedule_period_run'
      }
    ]
  });

  return PayrollRun;
};
