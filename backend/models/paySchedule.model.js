'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaySchedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // PaySchedule belongs to a Tenant
      PaySchedule.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false,
      });

      // A PaySchedule can be associated with many Employees
      PaySchedule.hasMany(models.Employee, { // This assumes Employee model will have a payScheduleId FK
        foreignKey: 'payScheduleId',
        as: 'employees',
      });

      // A PaySchedule can have many PayrollRuns
      PaySchedule.hasMany(models.PayrollRun, { // This assumes PayrollRun model will have a payScheduleId FK
        foreignKey: 'payScheduleId',
        as: 'payrollRuns',
      });
    }
  }

  PaySchedule.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id', // Added mapping
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: { // e.g., "Weekly (Monday-Sunday, Pay on Friday)"
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: { // Defines the pay period frequency
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['weekly', 'bi_weekly', 'semi_monthly', 'monthly', 'custom']],
      },
    },
    // For weekly/bi-weekly
    payPeriodStartDay: { // e.g., 1 (Monday) to 7 (Sunday) for weekly/bi-weekly
      type: DataTypes.INTEGER, // 1 for Monday, 7 for Sunday, etc.
      allowNull: true, // Null if not applicable (e.g. monthly)
    },
    // For semi-monthly
    firstPayDayOfMonth: { // e.g., 15 (for 15th of the month)
      type: DataTypes.INTEGER,
      allowNull: true, // Null if not semi-monthly
    },
    secondPayDayOfMonth: { // e.g., 30 (for 30th or end of month)
      type: DataTypes.INTEGER,
      allowNull: true, // Null if not semi-monthly
    },
    // For monthly
    payDayOfMonth: { // e.g., 25 (for 25th of the month) or -1 (for last day of month)
      type: DataTypes.INTEGER,
      allowNull: true, // Null if not monthly
    },
    payDayOffsetDays: { // Number of days after period end when payment is made.
      type: DataTypes.INTEGER,
      allowNull: true, // e.g., 5 days after period ends.
    },
    processingDayOffsetDays: { // How many days before pay day should payroll be processed.
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
    },
    // next_pay_date: { // Could be a calculated field or stored and updated
    //   type: DataTypes.DATEONLY,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'PaySchedule',
    tableName: 'pay_schedules',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { name: 'pay_schedules_tenant_id_idx', fields: ['tenantId'] }, // Updated
      { unique: true, fields: ['tenantId', 'name'], name: 'unique_tenant_payschedule_name' } // Updated
    ]
  });

  return PaySchedule;
};
