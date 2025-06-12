'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeSalarySetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EmployeeSalarySetting.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
        allowNull: false,
      });
      EmployeeSalarySetting.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee',
        allowNull: false,
      });
      EmployeeSalarySetting.belongsTo(models.SalaryComponent, {
        foreignKey: 'salaryComponentId',
        as: 'salaryComponent',
        allowNull: false,
      });
    }
  }

  EmployeeSalarySetting.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id',
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
      references: { model: 'employees', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    salaryComponentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'salary_component_id',
      references: { model: 'salary_components', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE', // Or RESTRICT if components shouldn't be deleted if in use
    },
    effective_date: { // Date from which this setting is effective
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // The actual value for the employee. This might override the default in SalaryComponent
    // or be based on its calculation_type.
    amount: { // Value for 'fixed' type components or specific override
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // Can be null if it's purely percentage based on another component via SalaryComponent logic
    },
    percentage: { // Specific percentage for this employee, if component is 'percentage' type
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true, // Can be null if not a percentage type or if amount is used
    },
    // Note: The actual calculation (e.g. percentage of what) is defined in the SalaryComponent.
    // This table stores the employee-specific value or percentage for that component.
    is_active: { // To easily enable/disable a component for an employee's salary
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    // remarks: { // Optional field for any notes related to this specific setting
    //   type: DataTypes.TEXT,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'EmployeeSalarySetting',
    tableName: 'employee_salary_settings',
    timestamps: true, // To track when this setting was created or last updated
    paranoid: true,   // If you need to keep history of settings even after "deletion"
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['employee_id'] },
      { fields: ['salary_component_id'] },
      // Ensures an employee doesn't have the same component active for the same effective date.
      // For true history, you might allow multiple records and pick the latest effective one.
      // Or, use is_active=false for older records of the same component for an employee.
      {
        unique: true,
        fields: ['employee_id', 'salary_component_id', 'effective_date'],
        name: 'unique_employee_component_effective_date'
      },
      {
        unique: true,
        fields: ['employee_id', 'salary_component_id'],
        name: 'unique_employee_active_component',
        where: { is_active: true } // Allow only one active record for each component per employee
      }
    ]
  });

  return EmployeeSalarySetting;
};
