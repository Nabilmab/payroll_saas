'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollRun extends Model {
    static associate(models) {
      PayrollRun.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      PayrollRun.belongsTo(models.PaySchedule, { foreignKey: 'payScheduleId', as: 'paySchedule' });
      PayrollRun.belongsTo(models.User, { foreignKey: 'processedByUserId', as: 'processedByUser' });
      PayrollRun.belongsTo(models.User, { foreignKey: 'approvedByUserId', as: 'approvedByUser' });
      PayrollRun.hasMany(models.Payslip, { foreignKey: 'payrollRunId', as: 'payslips' });
    }
  }

  PayrollRun.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tenants', key: 'id' }
    },
    payScheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'pay_schedules', key: 'id' }
    },
    periodStart: { type: DataTypes.DATEONLY, allowNull: false },
    periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending_review' }, // Using STRING is often more flexible for ENUMs
    totalGrossPay: { type: DataTypes.DECIMAL(15, 2) },
    totalDeductions: { type: DataTypes.DECIMAL(15, 2) },
    totalNetPay: { type: DataTypes.DECIMAL(15, 2) },
    totalEmployees: { type: DataTypes.INTEGER },
    totalEmployerTaxes: { type: DataTypes.DECIMAL(15, 2) },
    processedByUserId: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'id' }
    },
    approvedByUserId: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'id' }
    },
    processedAt: { type: DataTypes.DATE },
    approvedAt: { type: DataTypes.DATE },
    notes: { type: DataTypes.TEXT },
  }, {
    sequelize,
    modelName: 'PayrollRun',
    tableName: 'payroll_runs',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      // FIX: Use snake_case column names when `underscored: true` is set.
      { fields: ['tenantId'] },
      { fields: ['payScheduleId'] },
      { fields: ['status'] },
      { fields: ['paymentDate'] },
      {
        unique: true,
        fields: ['tenantId', 'payScheduleId', 'periodEnd', 'status'],
        name: 'unique_tenant_schedule_period_run'
      }
    ]
  });

  return PayrollRun;
};